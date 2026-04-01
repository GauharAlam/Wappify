"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Package, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface FormState {
  name: string;
  description: string;
  price: string;
  stock: string;
  imageUrl: string;
}

interface FormErrors {
  name?: string;
  price?: string;
  stock?: string;
}

export interface EditProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  imageUrl: string | null;
}

interface AddProductDialogProps {
  /** Pass a product to open in edit mode */
  editProduct?: EditProduct | null;
  /** Called when dialog closes (edit mode cleanup) */
  onClose?: () => void;
  /** Whether the dialog should be open (controlled mode for edit) */
  externalOpen?: boolean;
}

const INITIAL_FORM: FormState = {
  name: "",
  description: "",
  price: "",
  stock: "",
  imageUrl: "",
};

// ─────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────

function validateForm(form: FormState): FormErrors {
  const errors: FormErrors = {};

  if (!form.name.trim()) {
    errors.name = "Product name is required.";
  } else if (form.name.trim().length < 2) {
    errors.name = "Product name must be at least 2 characters.";
  }

  const price = parseFloat(form.price);
  if (!form.price) {
    errors.price = "Price is required.";
  } else if (isNaN(price) || price <= 0) {
    errors.price = "Enter a valid price greater than ₹0.";
  } else if (price > 1_00_000) {
    errors.price = "Price cannot exceed ₹1,00,000.";
  }

  const stock = parseInt(form.stock, 10);
  if (!form.stock) {
    errors.stock = "Stock quantity is required.";
  } else if (isNaN(stock) || stock < 0) {
    errors.stock = "Stock must be 0 or more.";
  }

  return errors;
}

// ─────────────────────────────────────────────
// Field component — keeps the template clean
// ─────────────────────────────────────────────

interface FieldProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}

function Field({ id, label, required, error, hint, children }: FieldProps) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
        {required && (
          <span className="ml-0.5 text-destructive" aria-hidden>
            *
          </span>
        )}
      </Label>

      {children}

      {error ? (
        <p className="text-xs font-medium text-destructive" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────

export default function AddProductDialog({
  editProduct,
  onClose,
  externalOpen,
}: AddProductDialogProps) {
  const router = useRouter();
  const isEditMode = !!editProduct;

  const getInitialForm = React.useCallback((): FormState => {
    if (editProduct) {
      return {
        name: editProduct.name,
        description: editProduct.description || "",
        price: editProduct.price.toString(),
        stock: editProduct.stock.toString(),
        imageUrl: editProduct.imageUrl || "",
      };
    }
    return INITIAL_FORM;
  }, [editProduct]);

  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<FormState>(getInitialForm);
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(
    null,
  );

  // Sync with external open state (for edit mode)
  const isOpen = externalOpen !== undefined ? externalOpen : open;

  // Reset form when editProduct changes
  React.useEffect(() => {
    if (editProduct) {
      setForm(getInitialForm());
      setErrors({});
      setServerError(null);
      setSuccessMessage(null);
    }
  }, [editProduct, getInitialForm]);

  // ── Helpers ────────────────────────────────

  const resetState = () => {
    setForm(INITIAL_FORM);
    setErrors({});
    setServerError(null);
    setSuccessMessage(null);
    setIsSubmitting(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetState();
      onClose?.();
    }
    if (externalOpen === undefined) {
      setOpen(nextOpen);
    } else if (!nextOpen) {
      onClose?.();
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    // Clear field error on change
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }

    // Clear server error when user edits anything
    if (serverError) setServerError(null);
  };

  // ── Submit ─────────────────────────────────

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setServerError(null);
    setSuccessMessage(null);

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        price: parseFloat(form.price),
        stock: parseInt(form.stock, 10),
        imageUrl: form.imageUrl.trim() || null,
      };

      const url = isEditMode
        ? `/api/products/${editProduct!.id}`
        : "/api/products";
      const method = isEditMode ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const message =
          data?.message ||
          `Failed to ${isEditMode ? "update" : "add"} product (${response.status}). Please try again.`;
        throw new Error(message);
      }

      const product = await response.json();
      console.log(
        `[AddProductDialog] Product ${isEditMode ? "updated" : "created"}:`,
        product.id || product.name,
      );

      setSuccessMessage(
        isEditMode
          ? `"${product.name}" updated successfully! ✅`
          : `"${product.name}" added to your catalog! 🎉`,
      );

      // Refresh Server Component data without a full page reload
      router.refresh();

      // Auto-close the dialog after a short success flash
      setTimeout(() => {
        handleOpenChange(false);
      }, 1200);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.";
      console.error("[AddProductDialog] Submit error:", message);
      setServerError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render ─────────────────────────────────

  const dialogContent = (
    <DialogContent className="sm:max-w-[520px]">
      <DialogHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            {isEditMode ? (
              <Pencil className="h-5 w-5 text-primary" />
            ) : (
              <Package className="h-5 w-5 text-primary" />
            )}
          </div>
          <div>
            <DialogTitle>
              {isEditMode ? "Edit Product" : "Add New Product"}
            </DialogTitle>
            <DialogDescription className="mt-0.5 text-xs">
              {isEditMode
                ? "Update the product details. Changes will reflect in WhatsApp immediately."
                : "This product will appear in the WhatsApp catalog immediately."}
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      {/* ── Form ──────────────────────────── */}
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid gap-4 py-2">
          {/* Name */}
          <Field
            id="name"
            label="Product Name"
            required
            error={errors.name}
          >
            <Input
              id="name"
              name="name"
              placeholder="e.g. Classic Cotton Tee"
              value={form.name}
              onChange={handleChange}
              disabled={isSubmitting}
              aria-invalid={!!errors.name}
              maxLength={100}
              autoFocus
            />
          </Field>

          {/* Description */}
          <Field
            id="description"
            label="Description"
            hint="This text is sent to customers on WhatsApp when they ask about this product."
          >
            <Textarea
              id="description"
              name="description"
              placeholder="e.g. 100% pure cotton, available in S, M, L, XL. Perfect for everyday wear."
              value={form.description}
              onChange={handleChange}
              disabled={isSubmitting}
              rows={3}
              maxLength={500}
              className="resize-none"
            />
          </Field>

          {/* Price + Stock — side by side */}
          <div className="grid grid-cols-2 gap-4">
            {/* Price */}
            <Field
              id="price"
              label="Price (₹)"
              required
              error={errors.price}
            >
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                  ₹
                </span>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  placeholder="499"
                  value={form.price}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  aria-invalid={!!errors.price}
                  min="0"
                  step="0.01"
                  className="pl-7"
                />
              </div>
            </Field>

            {/* Stock */}
            <Field
              id="stock"
              label="Stock Qty"
              required
              error={errors.stock}
            >
              <Input
                id="stock"
                name="stock"
                type="number"
                placeholder="50"
                value={form.stock}
                onChange={handleChange}
                disabled={isSubmitting}
                aria-invalid={!!errors.stock}
                min="0"
                step="1"
              />
            </Field>
          </div>

          {/* Image URL */}
          <Field
            id="imageUrl"
            label="Image URL"
            hint="Optional. Paste a direct link to the product image (JPEG / PNG / WebP)."
          >
            <Input
              id="imageUrl"
              name="imageUrl"
              type="url"
              placeholder="https://example.com/product.jpg"
              value={form.imageUrl}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </Field>
        </div>

        {/* ── Feedback messages ──────────── */}
        {serverError && (
          <div
            role="alert"
            className="mt-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs font-medium text-destructive"
          >
            ⚠️ {serverError}
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className="mt-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-xs font-medium text-green-700"
          >
            ✅ {successMessage}
          </div>
        )}

        {/* ── Footer ─────────────────────── */}
        <DialogFooter className="mt-5">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : isEditMode ? (
              <>
                <Pencil className="h-4 w-4" />
                Save Changes
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Add Product
              </>
            )}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );

  // In edit mode, dialog is controlled externally (no trigger button)
  if (isEditMode) {
    return (
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        {dialogContent}
      </Dialog>
    );
  }

  // In add mode, show the trigger button
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </DialogTrigger>
      {dialogContent}
    </Dialog>
  );
}
