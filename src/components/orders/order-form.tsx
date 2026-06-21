"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AsyncCombobox } from "@/components/shared/async-combobox";
import { searchCustomersAction, searchItemsAction } from "@/actions/order-lookup-actions";
import { createOrder, updateOrder } from "@/actions/order-actions";
import { OrderInput, OrderItemInput } from "@/lib/validators/order";

interface CustomerHit {
  id: string;
  name: string;
  mobile: string;
  address: string | null;
}

interface ItemHit {
  id: string;
  itemName: string;
}

interface StaffOption {
  id: string;
  name: string;
  role: string;
}

interface ItemRow extends OrderItemInput {
  rowId: string;
}

function defaultDeliveryDate() {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  return d.toISOString().slice(0, 10);
}

function emptyRow(): ItemRow {
  return {
    rowId: Math.random().toString(36).slice(2),
    itemName: "",
    description: "",
    quantity: 1,
    unitPrice: 0,
  };
}

interface OrderFormProps {
  mode: "create" | "edit";
  orderDbId?: string;
  role: "ADMIN" | "STAFF";
  staffOptions: StaffOption[];
  orderTakenByName?: string;
  initialValues?: Partial<OrderInput> & { items?: OrderItemInput[] };
  onSuccess?: () => void;
}

export function OrderForm({
  mode,
  orderDbId,
  role,
  staffOptions,
  orderTakenByName,
  initialValues,
  onSuccess,
}: OrderFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [customerName, setCustomerName] = useState(initialValues?.customerName ?? "");
  const [customerMobile, setCustomerMobile] = useState(initialValues?.customerMobile ?? "");
  const [customerAddress, setCustomerAddress] = useState(initialValues?.customerAddress ?? "");
  const [items, setItems] = useState<ItemRow[]>(
    initialValues?.items && initialValues.items.length > 0
      ? initialValues.items.map((i) => ({ ...i, rowId: Math.random().toString(36).slice(2) }))
      : [emptyRow()]
  );
  const [advance, setAdvance] = useState(String(initialValues?.advance ?? "0"));
  const [totalCosting, setTotalCosting] = useState(
    initialValues?.totalCosting !== undefined ? String(initialValues.totalCosting) : ""
  );
  const [deliveryDate, setDeliveryDate] = useState(
    initialValues?.deliveryDate ?? defaultDeliveryDate()
  );
  const [assignedToId, setAssignedToId] = useState(initialValues?.assignedToId ?? "");
  const [assignedToName, setAssignedToName] = useState(
    staffOptions.find((s) => s.id === initialValues?.assignedToId)?.name ?? ""
  );

  const totalBill = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const due = totalBill - (Number(advance) || 0);

  function fillCustomer(customer: CustomerHit) {
    setCustomerName(customer.name);
    setCustomerMobile(customer.mobile);
    setCustomerAddress(customer.address ?? "");
  }

  function updateRow(rowId: string, patch: Partial<ItemRow>) {
    setItems((prev) => prev.map((row) => (row.rowId === rowId ? { ...row, ...patch } : row)));
  }

  function addRow() {
    setItems((prev) => [...prev, emptyRow()]);
  }

  function removeRow(rowId: string) {
    setItems((prev) => (prev.length > 1 ? prev.filter((row) => row.rowId !== rowId) : prev));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (items.some((row) => !row.itemName.trim())) {
      setError("Every item row needs an item name.");
      return;
    }

    setIsSubmitting(true);

    const payload: OrderInput = {
      customerName,
      customerMobile,
      customerAddress,
      items: items.map(({ rowId, ...rest }) => rest),
      advance: Number(advance),
      totalCosting:
        role === "ADMIN" && totalCosting !== "" ? Number(totalCosting) : undefined,
      deliveryDate,
      assignedToId: assignedToId || null,
    };

    const result =
      mode === "create"
        ? await createOrder(payload)
        : await updateOrder(orderDbId as string, payload);

    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    if (onSuccess) {
      onSuccess();
    } else {
      router.push(role === "ADMIN" ? "/orders" : "/dashboard");
    }
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="customerName">Customer Name</Label>
          <AsyncCombobox<CustomerHit>
            id="customerName"
            value={customerName}
            onValueChange={setCustomerName}
            onSearch={searchCustomersAction}
            onSelect={fillCustomer}
            getItemKey={(c) => c.id}
            placeholder="Type to search (e.g. Rah...)"
            renderItem={(c) => (
              <>
                <span className="font-medium text-gray-800">{c.name}</span>
                <span className="text-xs text-gray-500">{c.mobile}</span>
              </>
            )}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="customerMobile">Mobile Number</Label>
          <AsyncCombobox<CustomerHit>
            id="customerMobile"
            value={customerMobile}
            onValueChange={setCustomerMobile}
            onSearch={searchCustomersAction}
            onSelect={fillCustomer}
            getItemKey={(c) => c.id}
            placeholder="Type to search (e.g. 01712...)"
            renderItem={(c) => (
              <>
                <span className="font-medium text-gray-800">{c.mobile}</span>
                <span className="text-xs text-gray-500">{c.name}</span>
              </>
            )}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="customerAddress">Address</Label>
        <Input
          id="customerAddress"
          value={customerAddress}
          onChange={(e) => setCustomerAddress(e.target.value)}
        />
      </div>

      {/* Multi-item rows */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Items</Label>
          <Button type="button" variant="outline" size="sm" onClick={addRow}>
            <Plus className="mr-1 h-3 w-3" /> Add Item
          </Button>
        </div>

        <div className="space-y-3">
          {items.map((row, idx) => (
            <div
              key={row.rowId}
              className="grid grid-cols-1 gap-2 rounded-md border border-gray-200 p-3 sm:grid-cols-[2fr_1fr_1fr_1fr_auto]"
            >
              <div className="space-y-1">
                {idx === 0 && <Label className="text-xs text-gray-500">Item Name</Label>}
                <AsyncCombobox<ItemHit>
                  value={row.itemName}
                  onValueChange={(v) => updateRow(row.rowId, { itemName: v })}
                  onSearch={searchItemsAction}
                  onSelect={(item) => updateRow(row.rowId, { itemName: item.itemName })}
                  getItemKey={(i) => i.id}
                  placeholder="e.g. Visiting Card"
                  renderItem={(i) => <span className="text-gray-800">{i.itemName}</span>}
                />
              </div>

              <div className="space-y-1">
                {idx === 0 && <Label className="text-xs text-gray-500">Qty</Label>}
                <Input
                  type="number"
                  min={1}
                  value={row.quantity}
                  onChange={(e) => updateRow(row.rowId, { quantity: Number(e.target.value) })}
                  required
                />
              </div>

              <div className="space-y-1">
                {idx === 0 && <Label className="text-xs text-gray-500">Unit Price</Label>}
                <Input
                  type="number"
                  min={0}
                  value={row.unitPrice}
                  onChange={(e) => {
                    const unitPrice = Number(e.target.value);
                    updateRow(row.rowId, { unitPrice });
                  }}
                  required
                />
              </div>

              <div className="space-y-1">
                {idx === 0 && <Label className="text-xs text-gray-500">Total Price</Label>}
                <Input
                  type="number"
                  min={0}
                  value={(row.quantity * row.unitPrice).toString()}
                  onChange={(e) => {
                    const lineTotal = Number(e.target.value);
                    const qty = row.quantity || 1;
                    // Auto back-calculate unit price from the typed total,
                    // rounded to 2 decimals so it stays a clean money value.
                    const unitPrice = Math.round((lineTotal / qty) * 100) / 100;
                    updateRow(row.rowId, { unitPrice });
                  }}
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => removeRow(row.rowId)}
                  disabled={items.length === 1}
                  className="rounded p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                  aria-label="Remove item row"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="sm:col-span-5">
                <Textarea
                  placeholder="Description (optional)"
                  value={row.description}
                  onChange={(e) => updateRow(row.rowId, { description: e.target.value })}
                  className="min-h-12"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Total Bill</Label>
          <Input value={totalBill.toString()} disabled />
        </div>
        <div className="space-y-2">
          <Label htmlFor="advance">Advance</Label>
          <Input
            id="advance"
            type="number"
            min={0}
            value={advance}
            onChange={(e) => setAdvance(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Due</Label>
          <Input value={due.toString()} disabled />
        </div>
      </div>

      {/* Total Costing — Admin only, never rendered for Staff (Security Rule 1).
          Can be left blank and filled in later once the job is finished. */}
      {role === "ADMIN" && (
        <div className="space-y-2 sm:w-1/3">
          <Label htmlFor="totalCosting">Total Costing (optional — can add later)</Label>
          <Input
            id="totalCosting"
            type="number"
            min={0}
            value={totalCosting}
            onChange={(e) => setTotalCosting(e.target.value)}
            placeholder="Leave blank if not known yet"
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="deliveryDate">Delivery Date</Label>
          <Input
            id="deliveryDate"
            type="date"
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
            required
          />
        </div>

        {role === "ADMIN" && (
          <div className="space-y-2">
            <Label htmlFor="assignedTo">Assigned To</Label>
            <AsyncCombobox<StaffOption>
              id="assignedTo"
              value={assignedToName}
              onValueChange={setAssignedToName}
              onSearch={(query) =>
                Promise.resolve(
                  staffOptions.filter((s) => s.name.toLowerCase().includes(query.toLowerCase()))
                )
              }
              onSelect={(s) => {
                setAssignedToId(s.id);
                setAssignedToName(s.name);
              }}
              getItemKey={(s) => s.id}
              placeholder="Search staff"
              renderItem={(s) => (
                <>
                  <span className="font-medium text-gray-800">{s.name}</span>
                  <span className="text-xs text-gray-500">{s.role}</span>
                </>
              )}
            />
          </div>
        )}
      </div>

      {orderTakenByName && (
        <p className="text-xs text-gray-400">Order taken by: {orderTakenByName}</p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === "create" ? "Save Order" : "Update Order"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
