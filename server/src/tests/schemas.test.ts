import { registerSchema, loginSchema, profileUpdateSchema } from '../schemas/auth.schema';
import { createPostSchema } from '../schemas/post.schema';
import { createMixSchema } from '../schemas/mix.schema';
import { createInventorySchema, updateInventorySchema } from '../schemas/inventory.schema';
import { createInvitationSchema } from '../schemas/invitation.schema';
import { createMenuSchema, updateMenuSchema } from '../schemas/menu.schema';
import { createPageSchema, updatePageSchema } from '../schemas/pages.schema';
import { createPromoSchema } from '../schemas/promo.schema';
import { createStorySchema, updateOrderSchema } from '../schemas/story.schema';
import { sendTelegramMessageSchema } from '../schemas/telegram.schema';

describe('auth schemas', () => {
  it('accepts a valid registration payload', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: 'secret1',
      name: 'Alice',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid email', () => {
    const result = registerSchema.safeParse({
      email: 'not-an-email',
      password: 'secret1',
      name: 'Alice',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a password shorter than 6 characters', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: '123',
      name: 'Alice',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an empty name', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: 'secret1',
      name: '',
    });
    expect(result.success).toBe(false);
  });

  it('login accepts any non-empty password', () => {
    expect(
      loginSchema.safeParse({ email: 'user@example.com', password: 'x' }).success
    ).toBe(true);
    expect(
      loginSchema.safeParse({ email: 'user@example.com', password: '' }).success
    ).toBe(false);
  });

  it('profile update accepts an empty object and enforces field limits', () => {
    expect(profileUpdateSchema.safeParse({}).success).toBe(true);
    expect(profileUpdateSchema.safeParse({ name: '' }).success).toBe(false);
    expect(profileUpdateSchema.safeParse({ bio: 'a'.repeat(501) }).success).toBe(false);
  });
});

describe('post schema', () => {
  it('defaults description to an empty string', () => {
    const result = createPostSchema.safeParse({ title: 'Hello' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.description).toBe('');
  });

  it('requires a non-empty title', () => {
    expect(createPostSchema.safeParse({ title: '' }).success).toBe(false);
    expect(createPostSchema.safeParse({}).success).toBe(false);
  });
});

describe('mix schema', () => {
  it('applies defaults for optional fields', () => {
    const result = createMixSchema.safeParse({ name: 'Mint', manufacturer: 'Acme' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe('');
      expect(result.data.flavors).toEqual([]);
      expect(result.data.strength).toBe(5);
      expect(result.data.status).toBe('active');
    }
  });

  it('enforces strength bounds (1-10)', () => {
    expect(
      createMixSchema.safeParse({ name: 'M', manufacturer: 'A', strength: 0 }).success
    ).toBe(false);
    expect(
      createMixSchema.safeParse({ name: 'M', manufacturer: 'A', strength: 11 }).success
    ).toBe(false);
  });

  it('rejects an invalid status enum', () => {
    expect(
      createMixSchema.safeParse({ name: 'M', manufacturer: 'A', status: 'archived' }).success
    ).toBe(false);
  });

  it('requires name and manufacturer', () => {
    expect(createMixSchema.safeParse({ manufacturer: 'A' }).success).toBe(false);
    expect(createMixSchema.safeParse({ name: 'M' }).success).toBe(false);
  });
});

describe('inventory schemas', () => {
  it('accepts a valid create payload with defaults', () => {
    const result = createInventorySchema.safeParse({
      name: 'Coal',
      category: 'Supplies',
      quantity: 10,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.unit).toBe('шт');
      expect(result.data.min_stock).toBe(0);
    }
  });

  it('rejects a negative quantity', () => {
    expect(
      createInventorySchema.safeParse({ name: 'Coal', category: 'S', quantity: -1 }).success
    ).toBe(false);
  });

  it('rejects a non-integer quantity', () => {
    expect(
      createInventorySchema.safeParse({ name: 'Coal', category: 'S', quantity: 1.5 }).success
    ).toBe(false);
  });

  it('update schema allows a partial payload', () => {
    expect(updateInventorySchema.safeParse({ quantity: 5 }).success).toBe(true);
    expect(updateInventorySchema.safeParse({}).success).toBe(true);
  });
});

describe('invitation schema', () => {
  it('accepts a valid payload and defaults status to draft', () => {
    const result = createInvitationSchema.safeParse({
      title: 'Party',
      description: 'Come join us',
      dateTime: '2026-01-01T20:00:00Z',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.status).toBe('draft');
  });

  it('requires title, description and dateTime', () => {
    expect(createInvitationSchema.safeParse({ title: 'X', description: 'Y' }).success).toBe(false);
    expect(createInvitationSchema.safeParse({ title: '', description: 'Y', dateTime: 'z' }).success).toBe(false);
  });

  it('rejects a maxParticipants below 1', () => {
    expect(
      createInvitationSchema.safeParse({
        title: 'P',
        description: 'D',
        dateTime: 'z',
        maxParticipants: 0,
      }).success
    ).toBe(false);
  });
});

describe('menu schemas', () => {
  it('accepts a valid payload with defaults', () => {
    const result = createMenuSchema.safeParse({ name: 'Tea', category: 'Drinks', price: 5 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.is_available).toBe(true);
      expect(result.data.sort_order).toBe(0);
    }
  });

  it('rejects a negative price', () => {
    expect(createMenuSchema.safeParse({ name: 'Tea', category: 'Drinks', price: -1 }).success).toBe(false);
  });

  it('accepts an empty string image_url but rejects a malformed url', () => {
    expect(
      createMenuSchema.safeParse({ name: 'Tea', category: 'D', price: 1, image_url: '' }).success
    ).toBe(true);
    expect(
      createMenuSchema.safeParse({ name: 'Tea', category: 'D', price: 1, image_url: 'not-a-url' }).success
    ).toBe(false);
  });

  it('update schema allows partial data', () => {
    expect(updateMenuSchema.safeParse({ price: 9 }).success).toBe(true);
  });
});

describe('pages schemas', () => {
  it('accepts a valid slug', () => {
    const result = createPageSchema.safeParse({
      slug: 'about-us',
      title: 'About',
      content: 'Hello',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.is_published).toBe(false);
  });

  it('rejects a slug with invalid characters', () => {
    expect(
      createPageSchema.safeParse({ slug: 'About Us!', title: 'T', content: 'C' }).success
    ).toBe(false);
  });

  it('requires non-empty content', () => {
    expect(createPageSchema.safeParse({ slug: 'a', title: 'T', content: '' }).success).toBe(false);
  });

  it('update schema validates slug format when provided', () => {
    expect(updatePageSchema.safeParse({ slug: 'valid-slug' }).success).toBe(true);
    expect(updatePageSchema.safeParse({ slug: 'Invalid Slug' }).success).toBe(false);
  });
});

describe('promo schema', () => {
  it('applies defaults for optional fields', () => {
    const result = createPromoSchema.safeParse({ title: 'Sale', description: 'Big sale' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.badgeColor).toBe('#00f2fe');
      expect(result.data.priority).toBe(0);
      expect(result.data.isActive).toBe(true);
    }
  });

  it('enforces discountPercent bounds (0-100)', () => {
    expect(
      createPromoSchema.safeParse({ title: 'S', description: 'D', discountPercent: -1 }).success
    ).toBe(false);
    expect(
      createPromoSchema.safeParse({ title: 'S', description: 'D', discountPercent: 101 }).success
    ).toBe(false);
    expect(
      createPromoSchema.safeParse({ title: 'S', description: 'D', discountPercent: 50 }).success
    ).toBe(true);
  });

  it('requires title and description', () => {
    expect(createPromoSchema.safeParse({ title: 'S' }).success).toBe(false);
  });
});

describe('story schemas', () => {
  it('applies defaults for a create payload', () => {
    const result = createStorySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.mediaType).toBe('image');
      expect(result.data.durationSeconds).toBe(5);
      expect(result.data.isActive).toBe(true);
    }
  });

  it('enforces durationSeconds bounds (1-60)', () => {
    expect(createStorySchema.safeParse({ durationSeconds: 0 }).success).toBe(false);
    expect(createStorySchema.safeParse({ durationSeconds: 61 }).success).toBe(false);
  });

  it('rejects an invalid mediaType', () => {
    expect(createStorySchema.safeParse({ mediaType: 'gif' }).success).toBe(false);
  });

  it('updateOrder schema validates an array of id/sortOrder pairs', () => {
    expect(
      updateOrderSchema.safeParse([{ id: 'a', sortOrder: 1 }, { id: 'b', sortOrder: 2 }]).success
    ).toBe(true);
    expect(updateOrderSchema.safeParse([{ id: '', sortOrder: 1 }]).success).toBe(false);
    expect(updateOrderSchema.safeParse([{ id: 'a', sortOrder: 1.5 }]).success).toBe(false);
  });
});

describe('telegram schema', () => {
  it('accepts a valid message and defaults parse_mode', () => {
    const result = sendTelegramMessageSchema.safeParse({ chat_id: '123', text: 'hi' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.parse_mode).toBe('MarkdownV2');
      expect(result.data.disable_web_page_preview).toBe(false);
    }
  });

  it('requires chat_id and text', () => {
    expect(sendTelegramMessageSchema.safeParse({ text: 'hi' }).success).toBe(false);
    expect(sendTelegramMessageSchema.safeParse({ chat_id: '1', text: '' }).success).toBe(false);
  });

  it('rejects text longer than 4000 characters', () => {
    expect(
      sendTelegramMessageSchema.safeParse({ chat_id: '1', text: 'a'.repeat(4001) }).success
    ).toBe(false);
  });

  it('rejects an invalid parse_mode', () => {
    expect(
      sendTelegramMessageSchema.safeParse({ chat_id: '1', text: 'hi', parse_mode: 'Plain' }).success
    ).toBe(false);
  });
});
