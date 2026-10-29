import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateItemUnitPrice,
  calculateOrderTotals,
  calculateTop5Products,
  canTransitionOrderStatus,
  calculateCashDifference,
  parseLocationCode,
  formatCurrencyARS,
} from './balnearioLogic';
import { Product, Order, CartItem } from '../types';

test('formatCurrencyARS formats numbers as Argentine Pesos', () => {
  assert.equal(formatCurrencyARS(11800), '$11.800 ARS');
  assert.equal(formatCurrencyARS(0), '$0 ARS');
  assert.equal(formatCurrencyARS(32400.75), '$32.401 ARS');
});

test('calculateItemUnitPrice calculates with base price, variants and addons', () => {
  const base = 10000;
  const addons = [
    { id: 'a1', name: 'Cheddar extra', price: 1500 },
    { id: 'a2', name: 'Panceta crocante', price: 1800 },
  ];
  assert.equal(calculateItemUnitPrice(base, undefined, addons), 13300);

  const variant = { id: 'v1', name: 'Triple Medallón', price: 14000 };
  assert.equal(calculateItemUnitPrice(base, variant, addons), 17300);
});

test('calculateOrderTotals applies subtotal, discount, service fee and total correctly', () => {
  const items: CartItem[] = [
    {
      id: 'item1',
      productId: 'p1',
      productName: 'Burger',
      productImage: '',
      basePrice: 10000,
      unitPrice: 10000,
      quantity: 2,
      removedIngredients: [],
      selectedAddons: [],
      subtotal: 20000,
    },
    {
      id: 'item2',
      productId: 'p2',
      productName: 'Cerveza',
      productImage: '',
      basePrice: 4000,
      unitPrice: 4000,
      quantity: 1,
      removedIngredients: [],
      selectedAddons: [],
      subtotal: 4000,
    },
  ];

  // 10% discount, cover fee $600 for 2 guests
  const totals = calculateOrderTotals(items, { type: 'percent', value: 10 }, 600, 2);
  assert.equal(totals.subtotal, 24000);
  assert.equal(totals.discountAmount, 2400); // 10% of 24000
  assert.equal(totals.serviceFee, 1200); // 600 * 2
  assert.equal(totals.total, 22800); // 24000 - 2400 + 1200
});

test('calculateTop5Products ranks by units sold, ratings tie-breaker, and detects demo fallback', () => {
  const products: Product[] = [
    {
      id: 'p1',
      name: 'Burger Doble Bacon',
      description: '',
      categoryId: 'cat1',
      price: 11800,
      image: '',
      sku: 'B-01',
      isAvailable: true,
      isActive: true,
      rating: 4.9,
      reviewsCount: 300,
      salesCount: 0,
      prepTimeMinutes: 15,
    },
    {
      id: 'p2',
      name: 'Rabas de Mar',
      description: '',
      categoryId: 'cat1',
      price: 15000,
      image: '',
      sku: 'R-01',
      isAvailable: true,
      isActive: true,
      rating: 4.8,
      reviewsCount: 200,
      salesCount: 0,
      prepTimeMinutes: 12,
    },
    {
      id: 'p3',
      name: 'Licuado Maracuyá',
      description: '',
      categoryId: 'cat2',
      price: 5500,
      image: '',
      sku: 'L-01',
      isAvailable: true,
      isActive: true,
      rating: 4.7,
      reviewsCount: 100,
      salesCount: 0,
      prepTimeMinutes: 5,
    },
  ];

  // Without orders, it flags isDemonstrationOnly: true
  const initial = calculateTop5Products(products, []);
  assert.equal(initial.isDemonstrationOnly, true);
  assert.equal(initial.products.length, 3);
  assert.equal(initial.products[0].name, 'Burger Doble Bacon');

  // With orders, it ranks by dynamicUnitsSold
  const sampleOrder: Order = {
    id: 'ord1',
    orderNumber: '#1001',
    locationId: 'c1',
    locationCode: 'C-01',
    locationName: 'Carpa C-01',
    locationType: 'carpa',
    items: [
      {
        id: 'i1',
        productId: 'p2',
        productName: 'Rabas de Mar',
        productImage: '',
        basePrice: 15000,
        unitPrice: 15000,
        quantity: 5,
        removedIngredients: [],
        selectedAddons: [],
        subtotal: 75000,
      },
      {
        id: 'i2',
        productId: 'p3',
        productName: 'Licuado Maracuyá',
        productImage: '',
        basePrice: 5500,
        unitPrice: 5500,
        quantity: 10,
        removedIngredients: [],
        selectedAddons: [],
        subtotal: 55000,
      },
    ],
    subtotal: 130000,
    discount: 0,
    serviceFee: 0,
    total: 130000,
    status: 'entregado',
    paymentStatus: 'cobrado',
    createdAt: new Date().toISOString(),
  };

  const dynamicRank = calculateTop5Products(products, [sampleOrder]);
  assert.equal(dynamicRank.isDemonstrationOnly, false);
  // Licuado has 10 units sold -> 1st
  assert.equal(dynamicRank.products[0].id, 'p3');
  assert.equal(dynamicRank.products[0].dynamicUnitsSold, 10);
  // Rabas has 5 units sold -> 2nd
  assert.equal(dynamicRank.products[1].id, 'p2');
  assert.equal(dynamicRank.products[1].dynamicUnitsSold, 5);
});

test('canTransitionOrderStatus enforces 10-step flow correctly', () => {
  // Step 3 (pendiente_confirmacion) can only go to Step 6 (confirmado_en_cocina) or cancelado
  assert.equal(canTransitionOrderStatus('pendiente_confirmacion', 'confirmado_en_cocina'), true);
  assert.equal(canTransitionOrderStatus('pendiente_confirmacion', 'cancelado'), true);
  assert.equal(canTransitionOrderStatus('pendiente_confirmacion', 'listo_para_entrega'), false);

  // Step 6 (confirmado_en_cocina) can move to en_preparacion
  assert.equal(canTransitionOrderStatus('confirmado_en_cocina', 'en_preparacion'), true);

  // Step 8 en_preparacion to listo_para_entrega
  assert.equal(canTransitionOrderStatus('en_preparacion', 'listo_para_entrega'), true);

  // Step 8 listo_para_entrega to entregado
  assert.equal(canTransitionOrderStatus('listo_para_entrega', 'entregado'), true);

  // Once entregado, stays delivered
  assert.equal(canTransitionOrderStatus('entregado', 'en_preparacion'), false);
});

test('calculateCashDifference detects exact, surplus, and shortages accurately', () => {
  const exact = calculateCashDifference(50000, 50000);
  assert.equal(exact.status, 'exact');
  assert.equal(exact.difference, 0);

  const surplus = calculateCashDifference(50000, 52500);
  assert.equal(surplus.status, 'surplus');
  assert.equal(surplus.difference, 2500);

  const shortage = calculateCashDifference(50000, 48000);
  assert.equal(shortage.status, 'shortage');
  assert.equal(shortage.difference, -2000);
});

test('parseLocationCode parses beach codes', () => {
  assert.deepEqual(parseLocationCode('C-01'), { type: 'carpa', number: 1, isValid: true });
  assert.deepEqual(parseLocationCode('S15'), { type: 'sombrilla', number: 15, isValid: true });
  assert.deepEqual(parseLocationCode('M-08'), { type: 'mesa_interior', number: 8, isValid: true });
  assert.deepEqual(parseLocationCode('D-04'), { type: 'mesa_exterior', number: 4, isValid: true });
  assert.equal(parseLocationCode('INVALID').isValid, false);
});
