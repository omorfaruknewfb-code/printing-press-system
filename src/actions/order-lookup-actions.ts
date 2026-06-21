"use server";

import { requireAuth } from "@/lib/permissions";
import { searchCustomers, searchItems, getActiveUsers } from "@/lib/orders-data";

export async function searchCustomersAction(query: string) {
  await requireAuth();
  return searchCustomers(query);
}

export async function searchItemsAction(query: string) {
  await requireAuth();
  return searchItems(query);
}

export async function getActiveUsersAction() {
  await requireAuth();
  return getActiveUsers();
}
