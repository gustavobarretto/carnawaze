import { z } from 'zod';

export const createUserBody = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(200),
  password: z.string().min(6).max(100),
});

export const confirmEmailBody = z.object({
  token: z.string().min(1).max(20),
});

export const resendConfirmationBody = z.object({
  email: z.string().email(),
});

export const loginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const updateMeBody = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).max(100).optional(),
  currentPassword: z.string().min(1).optional(),
});

export const createArtistBody = z.object({
  name: z.string().min(1).max(200),
});

export const createOrConfirmPinBody = z.object({
  artistId: z.string().uuid(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  type: z.enum(['create', 'confirm']),
});

export const reportIncorrectBody = z.object({
  artistId: z.string().uuid(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const createAdminUserBody = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(200),
  password: z.string().min(6).max(100),
});
