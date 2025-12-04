"use client";

import { useRouter } from "next/navigation";

import StatusBadge from "@/components/StatusBadge";
import { transactions } from "@/lib/transactions";
import { ArrowDownLeft, ArrowUpRight, Plus } from "lucide-react";

export function TransactionTable() {
  const router = useRouter();

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            Recent Transactions
          </h2>
          <p className="text-gray-500">Latest financial activities</p>
        </div>

        <button
          onClick={() => router.push("/add-transaction")}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 
                     text-white px-4 py-2 rounded-lg text-sm font-medium shadow"
        >
          <Plus className="w-4 h-4" />
          Add Transaction
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-700">
              <th className="py-3 px-5 font-medium">Transaction ID</th>
              <th className="py-3 px-5 font-medium">Description</th>
              <th className="py-3 px-5 font-medium">Category</th>
              <th className="py-3 px-5 font-medium">Date</th>
              <th className="py-3 px-5 font-medium">Status</th>
              <th className="py-3 px-5 font-medium text-right">Amount</th>
            </tr>
          </thead>

          <tbody>
            {transactions.map((tx) => (
              <tr
                key={tx.id}
                className="border-t border-gray-200 hover:bg-gray-50 transition"
              >
                <td className="py-4 px-5 text-blue-600 font-medium">{tx.id}</td>

                <td className="px-5">{tx.description}</td>

                <td className="px-5">
                  <span
                    className="px-3 py-1 text-sm bg-gray-100 rounded-full 
                               border border-gray-200"
                  >
                    {tx.category}
                  </span>
                </td>

                <td className="px-5 text-gray-500">{tx.date}</td>

                <td className="px-5">
                  <StatusBadge status={tx.status} />
                </td>

                <td
                  className={`px-5 font-semibold text-right ${
                    tx.amount < 0 ? "text-red-600" : "text-green-600"
                  }`}
                >
                  <div className="flex items-center justify-end gap-2">
                    {tx.amount > 0 ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownLeft className="w-4 h-4" />
                    )}

                    {tx.amount < 0
                      ? `-₹${Math.abs(tx.amount).toLocaleString("en-IN")}`
                      : `+₹${tx.amount.toLocaleString("en-IN")}`}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
