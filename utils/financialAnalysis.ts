export interface SpendingHealth {
  status: 'Safe' | 'Warning' | 'Danger';
  messageKey: string;
  messageParams?: Record<string, any>;
  color: string;
}

export const calculateSpendingHealth = (totalBudget: number, totalExpenses: number): SpendingHealth => {
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDay = now.getDate();

  // If budget is 0, we can't really calculate health
  if (totalBudget <= 0) {
    return {
      status: 'Warning',
      messageKey: 'analysis.set_budget',
      color: '#fbbf24' // amber-400
    };
  }

  // Calculate Linear Pace (Expected Spending)
  // e.g. Budget 3000, Day 10/30 -> Expected to have spent 1000
  const expectedSpending = (totalBudget / daysInMonth) * currentDay;

  // Thresholds
  const safeThreshold = expectedSpending;
  const warningThreshold = expectedSpending * 1.1; // 10% tolerance
  const dangerThreshold = expectedSpending * 1.2; // 20% tolerance

  if (totalExpenses <= safeThreshold) {
    return {
      status: 'Safe',
      messageKey: 'analysis.safe',
      color: '#10b981' // emerald-500
    };
  } else if (totalExpenses <= warningThreshold) {
    return {
      status: 'Safe', // Still relatively safe
      messageKey: 'analysis.safe',
      color: '#34d399' // emerald-400
    };
  } else if (totalExpenses <= dangerThreshold) {
    return {
      status: 'Warning',
      messageKey: 'analysis.warning',
      color: '#fbbf24' // amber-400
    };
  } else {
    // Calculate days to deplete
    // Daily average spending so far
    const dailyAvg = totalExpenses / currentDay;
    const remainingBudget = totalBudget - totalExpenses;
    const daysLeft = remainingBudget > 0 ? Math.floor(remainingBudget / dailyAvg) : 0;

    return {
      status: 'Danger',
      messageKey: 'analysis.critical',
      messageParams: { days: daysLeft },
      color: '#ef4444' // red-500
    };
  }
};
