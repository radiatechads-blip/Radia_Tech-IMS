import 'dotenv/config';
import { prisma } from './src/lib/db';

async function main() {
  try {
    const item = await prisma.serviceSpecialization.create({
      data: {
        title: 'Test specialisation',
        shortDescription: 'Short',
        fullDescription: 'Long',
        image: '',
        sortOrder: 1,
        isActive: true,
      },
    });
    console.log('created', item);
  } catch (error) {
    console.error('CREATE_ERROR', error);
    if (error && typeof error === 'object') {
      console.error('name', (error as any).name);
      console.error('code', (error as any).code);
      console.error('message', (error as any).message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
