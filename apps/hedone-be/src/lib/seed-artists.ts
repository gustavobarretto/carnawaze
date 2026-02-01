import { prisma } from './prisma.js';

/** 100 Brazilian artists that perform at Carnival in Salvador / Bahia. */
const CARNIVAL_ARTISTS = [
  'Ivete Sangalo', 'Claudia Leitte', 'Daniela Mercury', 'Carlinhos Brown',
  'Léo Santana', 'Ludmilla', 'Anitta', 'Pabllo Vittar', 'Psirico', 'Harmonia do Samba',
  'Banda Eva', 'Timbalada', 'Olodum', 'Ilê Aiyê', 'Ara Ketu', 'Parangolé',
  'Asa de Águia', 'Chiclete com Banana', 'Banda Beijo', 'Banda Cheiro de Amor',
  'Banda Reflexus', 'Banda Vingadora', 'Banda Didá', 'Margareth Menezes',
  'Gilberto Gil', 'Caetano Veloso', 'Maria Bethânia', 'Gal Costa', 'Tom Zé',
  'Trio Elétrico Dodô e Osmar', 'Bell Marques', 'Netinho', 'Saulo Fernandes',
  'Durval Lelys', 'Xanddy Harmonia', 'Banda Pagodarte', 'Banda Mel',
  'Banda Sabiá', 'Banda Tchakabum', 'Banda Coruja', 'Banda Pipoka',
  'Banda Vixe Mainha', 'Banda Sarará', 'Banda Crocodilo', 'Trio Coruja',
  'Trio Pipoka', 'Bloco Largadinho', 'Bloco Camaleão', 'Bloco Eva',
  'Bloco Timbalada', 'Bloco Olodum', 'Bloco Ilê Aiyê', 'Bloco Ara Ketu',
  'Bloco Malê Debalê', 'Bloco Muzenza', 'Bloco Cortejo Afro', 'Bloco Bankoma',
  'Bloco Os Negões', 'Bloco Afro Muzenza', 'Bloco Filhos de Gandhy',
  'Afro Reggae', 'Banda CWS', 'Banda Pimenta Nativa', 'Banda Garota Safada',
  'Banda Timbalada', 'Banda Ara Ketu', 'Banda Olodum', 'Banda Ilê Aiyê',
  'Banda Muzenza', 'Banda Malê Debalê', 'Gerônimo', 'Lazzo', 'Banda Akomabu',
  'Banda Djaí', 'Banda Tchakabum', 'Trio Eva', 'Trio Timbalada', 'Trio Olodum',
  'Trio Ilê Aiyê', 'Trio Ara Ketu', 'Trio Didá', 'Trio Muzenza', 'Trio Malê Debalê',
  'Banda Cidade Verde', 'Banda Parangolé', 'Banda Axé Bahia', 'Banda Axé Brasil',
  'Banda Axé Mimo', 'Banda Axé Top', 'Banda Axé Total', 'Banda Axé Máximo',
  'Banda Axé Show', 'Banda Axé Pop', 'Banda Axé Mix', 'Banda Axé Sound',
  'Banda Axé Live', 'Banda Axé Fest', 'Banda Axé Hit', 'Banda Axé Star',
  'Banda Axé Gold', 'Banda Axé Power', 'Banda Axé Dance', 'Banda Axezeira',
];

export async function seedCarnivalArtists(): Promise<void> {
  const count = await prisma.artist.count();
  if (count >= 100) return;

  const existing = await prisma.artist.findMany({ select: { name: true } });
  const existingSet = new Set(existing.map((a) => a.name.toLowerCase()));
  const uniqueNames = [...new Set(CARNIVAL_ARTISTS)];
  const toCreate = uniqueNames.filter((name) => !existingSet.has(name.toLowerCase()));
  if (toCreate.length === 0) return;

  await prisma.artist.createMany({
    data: toCreate.map((name) => ({ name })),
  });
  const after = await prisma.artist.count();
  console.log(`[dev] Seeded ${toCreate.length} carnival artists (total: ${after})`);
}
