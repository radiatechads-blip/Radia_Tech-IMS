import 'dotenv/config';
import { prisma } from './src/lib/db';
console.log('prisma client loaded');
console.log('serviceSpecialization exists', Boolean(prisma.serviceSpecialization));
console.log('serviceSpecialization create type', typeof prisma.serviceSpecialization?.create);
