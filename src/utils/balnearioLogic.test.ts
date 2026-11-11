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
  validateArgentinePhone,
  formatWhatsAppOrderMessage,
  matchProductSearch,
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

test('validateArgentinePhone handles standard Argentine mobile formats', () => {
  const r1 = validateArgentinePhone('+54 9 223 555-1234');
  assert.equal(r1.isValid, true);
  assert.equal(r1.cleanForWhatsApp, '5492235551234');

  const r2 = validateArgentinePhone('2235551234');
  assert.equal(r2.isValid, true);
  assert.equal(r2.cleanForWhatsApp, '5492235551234');

  const r3 = validateArgentinePhone('011 15-4444-3333');
  assert.equal(r3.isValid, true);
  assert.equal(r3.cleanForWhatsApp, '5491144443333');

  const rEmpty = validateArgentinePhone('');
  assert.equal(rEmpty.isValid, false);

  const rShort = validateArgentinePhone('1234');
  assert.equal(rShort.isValid, false);
});

test('formatWhatsAppOrderMessage generates the expected friendly verification text', () => {
  const dummyOrder: Order = {
    id: 'ord-test-1',
    orderNumber: '#1055',
    locationId: 'loc-c1',
    locationCode: 'C-01',
    locationName: 'Carpa VIP 01',
    locationType: 'carpa',
    customerName: 'Martín Rossi',
    customerPhone: '+5492235551234',
    items: [
      {
        id: 'i1',
        productId: 'p1',
        productName: 'Hamburguesa Doble',
        productImage: '',
        basePrice: 10000,
        unitPrice: 10000,
        quantity: 2,
        removedIngredients: ['Cebolla'],
        selectedAddons: [],
        subtotal: 20000,
      },
    ],
    subtotal: 20000,
    discount: 0,
    serviceFee: 0,
    total: 20000,
    status: 'pendiente_confirmacion',
    paymentStatus: 'pendiente',
    createdAt: new Date().toISOString(),
  };

  const message = formatWhatsAppOrderMessage(dummyOrder, 'Costa Serena');
  assert.ok(message.includes('Hola, *Martín Rossi*. Somos de *Costa Serena*.'));
  assert.ok(message.includes('Recibimos tu pedido *#1055*'));
  assert.ok(message.includes('2x Hamburguesa Doble [sin Cebolla]'));
  assert.ok(message.includes('Total: *$20.000 ARS*.'));
  assert.ok(message.includes('¡Gracias!'));
});

test('matchProductSearch matches written, voice, and partial colloquial queries', () => {
  const burger: Product = {
    id: 'b1',
    name: 'Hamburguesa Doble Novillo con Bacon',
    description: 'Doble medallón 100% novillo con cheddar y panceta',
    categoryId: 'c1',
    price: 11800,
    image: '',
    sku: 'BUR-01',
    isAvailable: true,
    isActive: true,
    rating: 4.9,
    reviewsCount: 100,
    salesCount: 10,
    prepTimeMinutes: 15,
  };

  const rabas: Product = {
    id: 'r1',
    name: 'Rabas de Mar a la Romana',
    description: 'Tubos de calamar fresco con limón y alioli',
    categoryId: 'c2',
    price: 15000,
    image: '',
    sku: 'MAR-01',
    isAvailable: true,
    isActive: true,
    rating: 4.8,
    reviewsCount: 50,
    salesCount: 8,
    prepTimeMinutes: 12,
  };

  const gaseosa: Product = {
    id: 'g1',
    name: 'Gaseosa Línea Cola 500ml',
    description: 'Refresco clásico bien frío',
    categoryId: 'c3',
    price: 3200,
    image: '',
    sku: 'BEB-01',
    isAvailable: true,
    isActive: true,
    rating: 4.5,
    reviewsCount: 20,
    salesCount: 30,
    prepTimeMinutes: 2,
  };

  // Check voice / text searches from prompt examples:
  assert.equal(matchProductSearch(burger, 'Hamburguesa completa'), true);
  assert.equal(matchProductSearch(burger, 'hamburguesa'), true);
  assert.equal(matchProductSearch(burger, 'BUR-01'), true);
  assert.equal(matchProductSearch(rabas, 'Rabas'), true);
  assert.equal(matchProductSearch(rabas, 'calamar'), true);
  assert.equal(matchProductSearch(gaseosa, 'Coca-Cola'), true);
  assert.equal(matchProductSearch(gaseosa, 'coca'), true);
  assert.equal(matchProductSearch(burger, 'rabas'), false);
});
