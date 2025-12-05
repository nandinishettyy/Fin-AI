"use client";

import { useState } from "react";
import { TransactionTable } from "./TransactionTable";
import TransactionForm from "../transactionForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function TransactionsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleTransactionSuccess = () => {
    setIsDialogOpen(false);
    setRefreshTrigger((prev) => prev + 1); // Trigger refresh
  };

  return (
    <main className="p-10 bg-gray-100 min-h-screen">
      <TransactionTable
        onAddTransaction={() => setIsDialogOpen(true)}
        refreshTrigger={refreshTrigger}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Transaction</DialogTitle>
          </DialogHeader>
          <TransactionForm onSuccess={handleTransactionSuccess} />
        </DialogContent>
      </Dialog>
    </main>
  );
}
