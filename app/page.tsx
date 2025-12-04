import { TransactionTable } from "./transactions/TransactionTable";

export default function TransactionsPage() {
  return (
    <main className="p-10 bg-gray-100 min-h-screen">
      <TransactionTable />
    </main>
  );
}
