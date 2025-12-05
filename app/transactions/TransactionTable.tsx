"use client";

import { useEffect, useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import { ArrowDownLeft, ArrowUpRight, Plus } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface ApiTransaction {
  id: number;
  date: string;
  amount: number;
  category: string;
  notes: string;
  type_of_transaction: string;
  created_at: string;
}

interface TransactionTableProps {
  onAddTransaction: () => void;
  refreshTrigger?: number;
}

export function TransactionTable({
  onAddTransaction,
  refreshTrigger,
}: TransactionTableProps) {
  const [transactions, setTransactions] = useState<ApiTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, [refreshTrigger]);

  async function fetchTransactions() {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(
        `${API_BASE_URL}/api/v1/transactions/?skip=0`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch transactions");
      }

      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setError("Failed to load transactions");
    } finally {
      setIsLoading(false);
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatus = (type: string) => {
    // You can customize this logic based on your needs
    return "completed";
  };

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
          onClick={onAddTransaction}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 
                     text-white px-4 py-2 rounded-lg text-sm font-medium shadow"
        >
          <Plus className="w-4 h-4" />
          Add Transaction
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-10">
          <p className="text-gray-500">Loading transactions...</p>
        </div>
      ) : error ? (
        <div className="text-center py-10">
          <p className="text-red-500">{error}</p>
          <button
            onClick={fetchTransactions}
            className="mt-4 text-blue-600 hover:underline"
          >
            Try again
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 max-h-[600px] overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-50 text-gray-700">
                <th className="py-3 px-5 font-medium">Transaction ID</th>
                <th className="py-3 px-5 font-medium">Description</th>
                <th className="py-3 px-5 font-medium">Category</th>
                <th className="py-3 px-5 font-medium">Date</th>
                <th className="py-3 px-5 font-medium">Status</th>
                <th className="py-3 px-5 font-medium text-right">Amount</th>
              </tr>
            </thead>

            <tbody className="bg-white">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-500">
                    No transactions found
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const isCredit =
                    tx.type_of_transaction.toLowerCase() === "credit";
                  const displayAmount = isCredit ? tx.amount : -tx.amount;

                  return (
                    <tr
                      key={tx.id}
                      className="border-t border-gray-200 hover:bg-gray-50 transition"
                    >
                      <td className="py-4 px-5 text-blue-600 font-medium">
                        {tx.id}
                      </td>

                      <td className="px-5">{tx.notes}</td>

                      <td className="px-5">
                        <span
                          className="px-3 py-1 text-sm bg-gray-100 rounded-full 
                                   border border-gray-200"
                        >
                          {tx.category}
                        </span>
                      </td>

                      <td className="px-5 text-gray-500">
                        {formatDate(tx.date)}
                      </td>

                      <td className="px-5">
                        <StatusBadge
                          status={getStatus(tx.type_of_transaction)}
                        />
                      </td>

                      <td
                        className={`px-5 font-semibold text-right ${
                          displayAmount < 0 ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        <div className="flex items-center justify-end gap-2">
                          {displayAmount > 0 ? (
                            <ArrowUpRight className="w-4 h-4" />
                          ) : (
                            <ArrowDownLeft className="w-4 h-4" />
                          )}

                          {displayAmount < 0
                            ? `-₹${Math.abs(displayAmount).toLocaleString(
                                "en-IN"
                              )}`
                            : `+₹${displayAmount.toLocaleString("en-IN")}`}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
