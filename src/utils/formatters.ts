export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const formatCurrency = (amount: number, currency: string = 'UGX'): string => {
  if (currency === 'UGX') {
    // Custom formatting for UGX to show "UGX XXXXX" format
    const number = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
    return `UGX ${number}`;
  } else {
    // Use standard formatting for other currencies
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: currency === 'USD' ? 2 : 0
    });
    return formatter.format(amount);
  }
};