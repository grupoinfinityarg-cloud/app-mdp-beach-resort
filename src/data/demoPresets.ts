export interface DemoPreset {
  id: string;
  name: string;
  branchName: string;
  slogan: string;
  address: string;
  city: string;
  phone: string;
  whatsappPhone: string;
  logoUrl?: string;
  categoryLabel?: string;
}

export const DEMO_PRESETS: Record<string, DemoPreset> = {
  marbella: {
    id: 'marbella',
    name: 'Balneario Marbella',
    branchName: 'Balneario Marbella',
    slogan: 'Tradición, Gastronomía & Carpas Exclusivas en Playa Grande',
    address: 'Paseo Victoria Ocampo 1240, Playa Grande',
    city: 'Mar del Plata, Buenos Aires',
    phone: '+54 9 223 540-8890',
    whatsappPhone: '5492235408890',
    logoUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=160&h=160&fit=crop&q=80',
    categoryLabel: 'Balneario Clásico con Carpas',
  },
  varese: {
    id: 'varese',
    name: 'Bahía Varese',
    branchName: 'Bahía Varese',
    slogan: 'La postal clásica de Mar del Plata con gastronomía de mar todo el año',
    address: 'Bv. Marítimo Patricio Peralta Ramos 3800, Bahía Varese',
    city: 'Mar del Plata, Buenos Aires',
    phone: '+54 9 223 512-3456',
    whatsappPhone: '5492235123456',
    logoUrl: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=160&h=160&fit=crop&q=80',
    categoryLabel: 'Complejo Gastronómico & Playa',
  },
  principe: {
    id: 'principe',
    name: 'Balneario Príncipe',
    branchName: 'Balneario Príncipe',
    slogan: 'Carpas, Sol & Descanso Familiar en las playas de La Perla',
    address: 'Bv. Marítimo Patricio Peralta Ramos 1000, La Perla',
    city: 'Mar del Plata, Buenos Aires',
    phone: '+54 9 223 523-4567',
    whatsappPhone: '5492235234567',
    categoryLabel: 'Balneario Tradicional La Perla',
  },
  sansebastian: {
    id: 'sansebastian',
    name: 'Balneario San Sebastián',
    branchName: 'Balneario San Sebastián',
    slogan: 'Deportes náuticos, pileta climatizada y carpas familiares de primera línea',
    address: 'Bv. Marítimo Patricio Peralta Ramos 1050, La Perla',
    city: 'Mar del Plata, Buenos Aires',
    phone: '+54 9 223 534-5678',
    whatsappPhone: '5492235345678',
    categoryLabel: 'Balneario Deportivo & Familiar',
  },
  abracadabra: {
    id: 'abracadabra',
    name: 'Abracadabra Beach',
    branchName: 'Abracadabra Beach',
    slogan: 'Sunsets inolvidables, coctelería de autor & gastronomía frente al mar',
    address: 'Ruta 11 Km 535, Playas del Sur',
    city: 'Mar del Plata, Buenos Aires',
    phone: '+54 9 223 545-6789',
    whatsappPhone: '5492235456789',
    logoUrl: 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=160&h=160&fit=crop&q=80',
    categoryLabel: 'Beach Club Exclusivo',
  },
  ufo: {
    id: 'ufo',
    name: 'UFO Point Pinamar',
    branchName: 'UFO Point Pinamar',
    slogan: 'El parador de moda en Pinamar: Gastronomía premium, música & relax',
    address: 'Av. del Mar y Robinson Crusoe',
    city: 'Pinamar, Buenos Aires',
    phone: '+54 9 2254 41-2345',
    whatsappPhone: '5492254412345',
    logoUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=160&h=160&fit=crop&q=80',
    categoryLabel: 'Parador & Nightclub',
  },
  hemingway: {
    id: 'hemingway',
    name: 'Parador Hemingway',
    branchName: 'Parador Hemingway',
    slogan: 'Entre el bosque y el océano: cocina mediterránea & sombra exclusiva en Cariló',
    address: 'Lambertiana y Playa',
    city: 'Cariló, Pinamar',
    phone: '+54 9 2254 42-3456',
    whatsappPhone: '5492254423456',
    categoryLabel: 'Parador Gourmet Cariló',
  },
  tandil: {
    id: 'tandil',
    name: 'Parador Lago del Fuerte',
    branchName: 'Parador Lago del Fuerte',
    slogan: 'Picadas serranas artesanales, cerveza tirada & vista panorámica al dique',
    address: 'Av. Zarini s/n, Dique del Fuerte',
    city: 'Tandil, Buenos Aires',
    phone: '+54 9 249 412-3456',
    whatsappPhone: '5492494123456',
    logoUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=160&h=160&fit=crop&q=80',
    categoryLabel: 'Parador Turístico Sierras',
  },
  laguna: {
    id: 'laguna',
    name: 'Club Náutico Laguna de los Padres',
    branchName: 'Club Náutico Laguna de los Padres',
    slogan: 'Parrilla criolla, deportes náuticos y aire libre a minutos de la ciudad',
    address: 'Reserva Natural Laguna de los Padres, Acceso Ruta 226 Km 14',
    city: 'Sierra de los Padres, Buenos Aires',
    phone: '+54 9 223 567-8901',
    whatsappPhone: '5492235678901',
    categoryLabel: 'Club Náutico & Recreativo',
  },
  luna_roja: {
    id: 'luna_roja',
    name: 'Luna Roja Chapadmalal',
    branchName: 'Luna Roja Chapadmalal',
    slogan: 'Ecoturismo, surf, cabañas sobre la playa y cocina orgánica de mar',
    address: 'Ruta 11 Km 542, Playa Luna Roja',
    city: 'Chapadmalal, Buenos Aires',
    phone: '+54 9 223 578-9012',
    whatsappPhone: '5492235789012',
    categoryLabel: 'Parador Ecoturístico & Surf',
  },
  chiringuito: {
    id: 'chiringuito',
    name: 'Chiringuito Playa Express',
    branchName: 'Chiringuito Playa Express',
    slogan: 'Bebidas heladas, licuados naturales y minutas calientes al paso en la arena',
    address: 'Bajada Náutica Playa Popular',
    city: 'Mar del Plata, Buenos Aires',
    phone: '+54 9 223 589-0123',
    whatsappPhone: '5492235890123',
    categoryLabel: 'Chiringuito / Parador Rápido',
  },
};

/**
 * Busca si un identificador o texto coincide con alguno de los presets.
 */
export function findDemoPreset(query?: string | null): DemoPreset | null {
  if (!query) return null;
  const clean = query.trim().toLowerCase();
  
  if (DEMO_PRESETS[clean]) return DEMO_PRESETS[clean];

  // Búsqueda difusa por nombre o id
  for (const preset of Object.values(DEMO_PRESETS)) {
    if (
      preset.id.toLowerCase() === clean ||
      preset.name.toLowerCase().includes(clean) ||
      clean.includes(preset.id.toLowerCase())
    ) {
      return preset;
    }
  }

  return null;
}
