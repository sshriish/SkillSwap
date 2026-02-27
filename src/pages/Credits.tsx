import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { CreditCard, TrendingUp, TrendingDown, Gift, RotateCcw } from "lucide-react";

const typeIcons: Record<string, any> = {
  earned: TrendingUp,
  spent: TrendingDown,
  bonus: Gift,
  refund: RotateCcw,
};

const typeColors: Record<string, string> = {
  earned: "text-success",
  spent: "text-destructive",
  bonus: "text-accent",
  refund: "text-info",
};

export default function Credits() {
  const { user } = useAuth();
  const [credits, setCredits] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [profileRes, txRes] = await Promise.all([
        supabase.from("profiles").select("credits").eq("user_id", user.id).single(),
        supabase.from("credit_transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
      ]);
      if (profileRes.data) setCredits(profileRes.data.credits);
      if (txRes.data) setTransactions(txRes.data);
    };
    load();
  }, [user]);

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-display font-bold">Credits</h1>
        </motion.div>

        <Card className="bg-gradient-primary text-primary-foreground">
          <CardContent className="flex items-center gap-4 p-8">
            <CreditCard className="h-10 w-10" />
            <div>
              <p className="text-sm opacity-80">Available Balance</p>
              <p className="text-4xl font-display font-bold">{credits}</p>
              <p className="text-sm opacity-70 mt-1">Earn credits by teaching. Spend them to learn.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Transaction History</CardTitle></CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No transactions yet. Complete a session to earn credits!</p>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => {
                  const Icon = typeIcons[tx.type] || CreditCard;
                  return (
                    <div key={tx.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                      <div className={`p-2 rounded-lg bg-muted ${typeColors[tx.type] || ""}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{tx.description || tx.type}</p>
                        <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className={`font-display font-bold ${tx.amount > 0 ? "text-success" : "text-destructive"}`}>
                        {tx.amount > 0 ? "+" : ""}{tx.amount}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
