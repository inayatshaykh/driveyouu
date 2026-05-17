import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { IndianRupee, TrendingUp, Calendar, Wallet } from 'lucide-react';
import { toast } from 'sonner';

interface EarningsSummary {
  today: number;
  thisWeek: number;
  thisMonth: number;
  totalEarnings: number;
  pendingPayout: number;
}

export function EarningsDashboard() {
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/driver/earnings', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch earnings');
      }

      setEarnings(data.earnings);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch earnings');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading earnings...</p>
      </div>
    );
  }

  if (!earnings) {
    return null;
  }

  const earningsCards = [
    {
      title: "Today's Earnings",
      amount: earnings.today,
      icon: IndianRupee,
      color: 'text-green-600',
    },
    {
      title: 'This Week',
      amount: earnings.thisWeek,
      icon: TrendingUp,
      color: 'text-blue-600',
    },
    {
      title: 'This Month',
      amount: earnings.thisMonth,
      icon: Calendar,
      color: 'text-purple-600',
    },
    {
      title: 'Pending Payout',
      amount: earnings.pendingPayout,
      icon: Wallet,
      color: 'text-orange-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {earningsCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹{card.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Earnings Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Earnings (All Time)</span>
              <span className="font-semibold">
                ₹{earnings.totalEarnings.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Your Share (80%)</span>
              <span className="font-medium text-green-600">
                ₹{(earnings.totalEarnings * 0.8).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Platform Commission (20%)</span>
              <span className="font-medium text-muted-foreground">
                ₹{(earnings.totalEarnings * 0.2).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Next Payout</p>
                <p className="text-xs text-muted-foreground">
                  Payouts are processed weekly on Mondays
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">
                  ₹{earnings.pendingPayout.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <h4 className="mb-2 font-medium">Commission Structure</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• You receive 80% of every trip fare</li>
              <li>• Platform retains 20% for operations</li>
              <li>• No hidden charges or deductions</li>
              <li>• Weekly payouts directly to your bank account</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
