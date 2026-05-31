import { Router, Request, Response, NextFunction } from 'express';
import { auth } from '../middleware/auth';
import { isAdmin } from '../middleware/isAdmin';
import { supabase } from '../config/supabase';

const router = Router();

function mapInvoiceToFrontend(i: any) {
  if (!i) return null;
  return {
    id: i.id,
    invoiceNumber: i.invoice_number,
    date: i.date,
    totalAmount: Number(i.total_amount),
    items: i.items,
    createdAt: i.created_at,
  };
}

// GET /api/invoices — Auth + Admin only
router.get('/', auth, isAdmin, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json((invoices || []).map(mapInvoiceToFrontend));
  } catch (error) {
    next(error);
  }
});

export default router;
