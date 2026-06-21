"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface PlainCustomer {
  id: string;
  name: string;
  mobile: string;
  address: string;
  totalOrders: number;
  totalBill: number;
  totalPaid: number;
  totalDue: number;
}

function formatMoney(value: number) {
  return `৳${value.toLocaleString("en-BD")}`;
}

export function CustomersTable({ customers }: { customers: PlainCustomer[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (search) params.set("search", search);
      else params.delete("search");
      router.push(`/customers?${params.toString()}`);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div className="space-y-4">
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name or mobile..."
          className="pl-9"
        />
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Mobile</th>
                <th className="px-4 py-3">Total Orders</th>
                <th className="px-4 py-3">Total Bill</th>
                <th className="px-4 py-3">Total Paid</th>
                <th className="px-4 py-3">Total Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                    No customers found.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={`/customers/${c.id}`} className="font-medium text-[#1E40AF] hover:underline">
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{c.mobile}</td>
                    <td className="px-4 py-3 text-gray-700">{c.totalOrders}</td>
                    <td className="px-4 py-3 text-gray-700">{formatMoney(c.totalBill)}</td>
                    <td className="px-4 py-3 text-gray-700">{formatMoney(c.totalPaid)}</td>
                    <td className="px-4 py-3 text-gray-700">{formatMoney(c.totalDue)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
