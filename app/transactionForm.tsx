"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm, ControllerRenderProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Zod Schema
const formSchema = z.object({
  notes: z.string().min(3, "Notes must be at least 3 characters"),
  amount: z.string().min(1, "Amount is required"),
  transactionDate: z.date(),
  department: z.string().min(1, "Department is required"),
  transactionType: z.string().min(1, "Transaction type is required"),
  category: z.string().min(1, "Category is required"),
});

interface ApiSuggestion {
  category: string;
  similarity_score: number;
  sample_notes: string;
  transaction_id: number;
}

interface ApiResponse {
  predicted_category: string;
  confidence: number;
  top_matches: ApiSuggestion[];
}

interface TransactionFormProps {
  onSuccess?: () => void;
}

interface Department {
  id: number;
  name: string;
}

export default function TransactionForm({ onSuccess }: TransactionFormProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [apiSuggestions, setApiSuggestions] = useState<ApiSuggestion[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoadingDepts, setIsLoadingDepts] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      notes: "",
      amount: "",
      transactionDate: new Date(),
      department: "",
      transactionType: "",
      category: "",
    },
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  async function fetchDepartments() {
    try {
      setIsLoadingDepts(true);
      const response = await fetch(`${API_BASE_URL}/api/v1/departments/`);

      if (!response.ok) {
        throw new Error("Failed to fetch departments");
      }

      const data = await response.json();
      setDepartments(data);
    } catch (error) {
      console.error("Error fetching departments:", error);
    } finally {
      setIsLoadingDepts(false);
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/transactions/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: values.transactionDate.toISOString(),
          amount: parseFloat(values.amount),
          category: values.category,
          notes: values.notes,
          type_of_transaction: values.transactionType,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create transaction");
      }
      form.reset();
      setShowSuggestions(false);
      setApiSuggestions([]);
      onSuccess?.();
    } catch (error) {
      console.error("Error creating transaction:", error);
      alert("Failed to create transaction. Please try again.");
    }
  }

  function getSuggestions() {
    const { amount, department, transactionType, notes } = form.getValues();
    const suggestions = [];

    // Primary suggestion based on department
    if (department === "it") {
      suggestions.push("Technology");
    } else if (department === "hr") {
      suggestions.push("Human Resources");
    } else if (department === "marketing") {
      suggestions.push("Marketing & Advertising");
    } else if (department === "finance") {
      suggestions.push("Office Supplies");
    } else {
      suggestions.push("General");
    }

    // Secondary suggestion based on transaction type and amount
    if (transactionType === "expense" && parseFloat(amount) > 1000) {
      suggestions.push("Major Expense");
    } else if (transactionType === "income") {
      suggestions.push("Revenue");
    } else if (transactionType === "expense") {
      suggestions.push("Travel & Expenses");
    } else {
      suggestions.push("Office Supplies");
    }

    // Third suggestion based on notes or fallback
    if (
      notes.toLowerCase().includes("travel") ||
      notes.toLowerCase().includes("trip")
    ) {
      suggestions.push("Travel & Expenses");
    } else if (
      notes.toLowerCase().includes("software") ||
      notes.toLowerCase().includes("hardware")
    ) {
      suggestions.push("Technology");
    } else {
      suggestions.push("General");
    }

    // Remove duplicates and ensure we have exactly 3 unique suggestions
    const uniqueSuggestions = [...new Set(suggestions)];
    const allCategories = [
      "Technology",
      "Human Resources",
      "Marketing & Advertising",
      "Office Supplies",
      "Travel & Expenses",
      "Revenue",
      "Major Expense",
      "General",
    ];

    while (uniqueSuggestions.length < 3) {
      for (const category of allCategories) {
        if (!uniqueSuggestions.includes(category)) {
          uniqueSuggestions.push(category);
          break;
        }
      }
    }

    return uniqueSuggestions.slice(0, 3);
  }

  async function handleMagicWand() {
    try {
      const { notes, amount, transactionType } = form.getValues();

      const response = await fetch(
        `${API_BASE_URL}/api/v1/transactions/predict-category`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            notes: notes || "",
            type_of_transaction: transactionType,
            amount: parseFloat(amount) || 0,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch suggestions");
      }

      const data: ApiResponse = await response.json();
      console.log("API Response:", data);

      // Get unique categories from top matches
      const uniqueCategories = Array.from(
        new Set(data.top_matches.map((match) => match.category))
      ).slice(0, 5);

      // Create suggestion objects with unique categories
      const topSuggestions = uniqueCategories.map((category) => {
        const match = data.top_matches.find((m) => m.category === category);
        return match!;
      });

      setApiSuggestions(topSuggestions);
      setShowSuggestions(true);
    } catch (error) {
      console.error("Error fetching category suggestions:", error);
      // Fallback to local suggestions if API fails
      setApiSuggestions([]);
      setShowSuggestions(true);
    }
  }

  function selectSuggestion(suggestion: string) {
    form.setValue("category", suggestion);
    setShowSuggestions(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Transaction Date and Amount Fields - Inline */}
        <div className="flex gap-6">
          <FormField
            control={form.control}
            name="transactionDate"
            render={({
              field,
            }: {
              field: ControllerRenderProps<
                z.infer<typeof formSchema>,
                "transactionDate"
              >;
            }) => (
              <FormItem className="flex-1">
                <FormLabel className="text-base font-semibold">Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal h-12 text-base",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date: Date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amount"
            render={({
              field,
            }: {
              field: ControllerRenderProps<
                z.infer<typeof formSchema>,
                "amount"
              >;
            }) => (
              <FormItem className="flex-1">
                <FormLabel className="text-base font-semibold">
                  Amount
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Enter the amount"
                    className="h-12 text-base"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Department and Transaction Type Fields - Inline */}
        <div className="grid grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="department"
            render={({
              field,
            }: {
              field: ControllerRenderProps<
                z.infer<typeof formSchema>,
                "department"
              >;
            }) => (
              <FormItem className="flex-1">
                <FormLabel className="text-base font-semibold">
                  Department
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoadingDepts}
                >
                  <FormControl>
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue
                        placeholder={
                          isLoadingDepts ? "Loading..." : "Select department"
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.name.toLowerCase()}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="transactionType"
            render={({
              field,
            }: {
              field: ControllerRenderProps<
                z.infer<typeof formSchema>,
                "transactionType"
              >;
            }) => (
              <FormItem className="flex-1">
                <FormLabel className="text-base font-semibold">
                  Transaction Type
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Debit">Debit</SelectItem>
                    <SelectItem value="Credit">Credit</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Notes Field */}
        <FormField
          control={form.control}
          name="notes"
          render={({
            field,
          }: {
            field: ControllerRenderProps<z.infer<typeof formSchema>, "notes">;
          }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold">Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter your notes"
                  className="min-h-[120px] text-base resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Category Field with Magic Wand Button */}
        <div>
          <div className="flex gap-1 items-end">
            <FormField
              control={form.control}
              name="category"
              render={({
                field,
              }: {
                field: ControllerRenderProps<
                  z.infer<typeof formSchema>,
                  "category"
                >;
              }) => (
                <FormItem className="flex-1">
                  <FormLabel className="text-base font-semibold">
                    Category
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter category"
                      className="h-12 text-base"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="button"
              variant="ghost"
              onClick={handleMagicWand}
              className="h-12 px-4"
              title="Get AI suggestions"
            >
              <svg
                width="800px"
                height="800px"
                viewBox="0 0 16 16"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  {/* <!-- Gradient: 40% pink, 30% blue, 30% skyblue --> */}
                  <linearGradient
                    id="starGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#FF69B4" />
                    <stop offset="40%" stopColor="#FF69B4" />
                    <stop offset="70%" stopColor="#1A73E8" />{" "}
                    {/* Blue 40-70% */}
                    <stop offset="100%" stopColor="#87CEEB" />{" "}
                    {/* Skyblue 70-100% */}
                  </linearGradient>
                </defs>

                {/* <!-- Black band (unchanged) --> */}
                <path
                  fill="#000000"
                  d="M12.52.55l-5,5h0L.55,12.51l3,3,12-12Zm-4,6,4-4,1,1-4,4.05Z"
                ></path>

                {/* <!-- Large star --> */}
                <path
                  fill="url(#starGradient)"
                  d="M2.77,3.18A3.85,3.85,0,0,1,5.32,5.73h0A3.85,3.85,0,0,1,7.87,3.18h0A3.82,3.82,0,0,1,5.32.64h0A3.82,3.82,0,0,1,2.77,3.18Z"
                ></path>

                {/* <!-- Top small star --> */}
                <path
                  fill="url(#starGradient)"
                  d="M8.5,2.55h0A2,2,0,0,1,9.78,1.27h0A1.92,1.92,0,0,1,8.5,0h0A1.88,1.88,0,0,1,7.23,1.27h0A1.92,1.92,0,0,1,8.5,2.55Z"
                ></path>

                {/* <!-- Left small star --> */}
                <path
                  fill="url(#starGradient)"
                  d="M2.14,2.55h0A1.92,1.92,0,0,1,3.41,1.27h0A1.88,1.88,0,0,1,2.14,0h0A1.92,1.92,0,0,1,.86,1.27h0A2,2,0,0,1,2.14,2.55Z"
                ></path>

                {/* <!-- Right twin star --> */}
                <path
                  fill="url(#starGradient)"
                  d="M14.73,6.22h0a1.94,1.94,0,0,1-1.28,1.27h0a1.94,1.94,0,0,1,1.28,1.27h0A1.9,1.9,0,0,1,16,7.49h0A1.9,1.9,0,0,1,14.73,6.22Z"
                ></path>
              </svg>
            </Button>
          </div>

          {/* Suggestions below the category field */}
          {showSuggestions && (
            <div className="mt-3">
              <p className="text-base font-medium text-muted-foreground mb-3">
                Suggested Categories:
              </p>
              <div className="flex gap-2 flex-wrap">
                {apiSuggestions.length > 0
                  ? // Display API suggestions
                    apiSuggestions.map((suggestion, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-sm py-2 px-4"
                        onClick={() => selectSuggestion(suggestion.category)}
                      >
                        {suggestion.category}
                      </Badge>
                    ))
                  : // Fallback to local suggestions
                    getSuggestions().map((suggestion, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-sm py-2 px-4"
                        onClick={() => selectSuggestion(suggestion)}
                      >
                        {suggestion}
                      </Badge>
                    ))}
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base font-semibold shadow-md hover:shadow-lg transition-all"
        >
          Submit Transaction
        </Button>
      </form>
    </Form>
  );
}
