import React, { useState, useEffect } from 'react';
import { Calculator } from 'lucide-react';

interface TaxBracket {
  min: number;
  max: number | null;
  rate: number;
}

interface Deduction {
  id: string;
  label: string;
  maxAmount: number;
  defaultAmount?: number;
}

function App() {
  const [annualIncome, setAnnualIncome] = useState<string>('');
  const [epf, setEpf] = useState<boolean>(true);
  const [socso, setSocso] = useState<boolean>(true);
  const [deductions, setDeductions] = useState<Record<string, number>>({});
  const [taxableIncome, setTaxableIncome] = useState<number>(0);
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [effectiveRate, setEffectiveRate] = useState<number>(0);
  const [totalDeductions, setTotalDeductions] = useState<number>(0);

  const taxBrackets: TaxBracket[] = [
    { min: 0, max: 5000, rate: 0 },
    { min: 5001, max: 20000, rate: 1 },
    { min: 20001, max: 35000, rate: 3 },
    { min: 35001, max: 50000, rate: 8 },
    { min: 50001, max: 70000, rate: 13 },
    { min: 70001, max: 100000, rate: 21 },
    { min: 100001, max: 250000, rate: 24 },
    { min: 250001, max: 400000, rate: 24.5 },
    { min: 400001, max: 600000, rate: 25 },
    { min: 600001, max: 1000000, rate: 26 },
    { min: 1000001, max: null, rate: 28 }
  ];

  const availableDeductions: Deduction[] = [
    { id: 'personal', label: 'Personal Relief', maxAmount: 9000, defaultAmount: 9000 },
    { id: 'medical', label: 'Medical Expenses', maxAmount: 8000 },
    { id: 'lifestyle', label: 'Lifestyle', maxAmount: 2500 },
    { id: 'education', label: 'Education Fees', maxAmount: 7000 },
    { id: 'housing', label: 'Housing Loan Interest', maxAmount: 10000 },
    { id: 'insurance', label: 'Life Insurance & Takaful', maxAmount: 3000 },
    { id: 'parents', label: 'Parents Care', maxAmount: 3000 },
    { id: 'equipment', label: 'Lifestyle Equipment', maxAmount: 2500 },
    { id: 'domestic', label: 'Domestic Tourism', maxAmount: 1000 }
  ];

  useEffect(() => {
    const defaultDeductions: Record<string, number> = {};
    availableDeductions.forEach(deduction => {
      if (deduction.defaultAmount) {
        defaultDeductions[deduction.id] = deduction.defaultAmount;
      }
    });
    setDeductions(defaultDeductions);
  }, []);

  const calculateSocso = (monthlyIncome: number): number => {
    if (!socso) return 0;
    const annualRate = monthlyIncome <= 5000 ? 0.005 : 0.006;
    return monthlyIncome * 12 * annualRate;
  };

  const calculateTax = (income: number) => {
    let totalTax = 0;
    let remainingIncome = income;

    for (const bracket of taxBrackets) {
      if (remainingIncome <= 0) break;

      const taxableAmount = bracket.max 
        ? Math.min(remainingIncome, bracket.max - bracket.min + 1)
        : remainingIncome;

      totalTax += (taxableAmount * bracket.rate) / 100;
      remainingIncome -= taxableAmount;
    }

    return totalTax;
  };

  const formatNumber = (value: string): string => {
    // Remove non-numeric characters except decimal point
    const numericValue = value.replace(/[^\d.]/g, '');
    
    // Split into integer and decimal parts
    const [integerPart, decimalPart] = numericValue.split('.');
    
    // Add commas to integer part
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    // Return formatted number with decimal part if it exists
    return decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger;
  };

  const handleIncomeChange = (value: string) => {
    const formattedValue = formatNumber(value);
    setAnnualIncome(formattedValue);
  };

  const handleDeductionChange = (id: string, value: string) => {
    const deduction = availableDeductions.find(d => d.id === id);
    if (!deduction) return;

    const formattedValue = formatNumber(value);
    const numericValue = parseFloat(value.replace(/,/g, '')) || 0;
    const cappedValue = Math.min(numericValue, deduction.maxAmount);

    setDeductions(prev => ({
      ...prev,
      [id]: cappedValue
    }));

    return formattedValue;
  };

  useEffect(() => {
    const income = parseFloat(annualIncome.replace(/,/g, '')) || 0;
    const monthlyIncome = income / 12;
    
    const epfDeduction = epf ? income * 0.11 : 0;
    const socsoDeduction = calculateSocso(monthlyIncome);
    const reliefDeductions = Object.values(deductions).reduce((sum, value) => sum + (value || 0), 0);
    
    const totalDeductionsAmount = epfDeduction + socsoDeduction + reliefDeductions;
    setTotalDeductions(totalDeductionsAmount);
    
    const calculatedTaxableIncome = Math.max(0, income - totalDeductionsAmount);
    setTaxableIncome(calculatedTaxableIncome);
    
    const calculatedTax = calculateTax(calculatedTaxableIncome);
    setTaxAmount(calculatedTax);
    setEffectiveRate(income > 0 ? (calculatedTax / income) * 100 : 0);
  }, [annualIncome, epf, socso, deductions]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 px-4 py-6 sm:py-12">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center gap-3 mb-6 sm:mb-8">
            <Calculator className="w-8 h-8 text-indigo-600" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center sm:text-left">
              Malaysian Income Tax Calculator 2024
            </h1>
          </div>

          <div className="space-y-6">
            {/* Income Section */}
            <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Income Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Annual Income (MYR)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={annualIncome}
                    onChange={(e) => handleIncomeChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter your annual income"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="epf"
                      checked={epf}
                      onChange={(e) => setEpf(e.target.checked)}
                      className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="epf" className="ml-2 block text-sm text-gray-700">
                      Include EPF (11%)
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="socso"
                      checked={socso}
                      onChange={(e) => setSocso(e.target.checked)}
                      className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="socso" className="ml-2 block text-sm text-gray-700">
                      Include SOCSO
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Results Section */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Total Deductions</h3>
                <p className="text-xl sm:text-2xl font-bold text-indigo-600">
                  MYR {totalDeductions.toLocaleString('en-MY', { maximumFractionDigits: 2 })}
                </p>
              </div>

              <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Taxable Income</h3>
                <p className="text-xl sm:text-2xl font-bold text-indigo-600">
                  MYR {taxableIncome.toLocaleString('en-MY', { maximumFractionDigits: 2 })}
                </p>
              </div>

              <div className="bg-indigo-100 p-4 sm:p-6 rounded-lg">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Tax Amount</h3>
                <p className="text-xl sm:text-2xl font-bold text-indigo-600">
                  MYR {taxAmount.toLocaleString('en-MY', { maximumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Effective Rate: {effectiveRate.toFixed(2)}%
                </p>
              </div>
            </div>

            {/* Tax Relief Section */}
            <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Tax Relief</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {availableDeductions.map((deduction) => (
                  <div key={deduction.id} className="bg-white p-4 rounded-lg shadow-sm">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {deduction.label}
                      <span className="block text-xs text-gray-500">
                        Max: MYR {deduction.maxAmount.toLocaleString()}
                      </span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={deductions[deduction.id]?.toLocaleString() || ''}
                      onChange={(e) => handleDeductionChange(deduction.id, e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter amount"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Tax Brackets Table */}
            <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">2024 Tax Brackets</h3>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Chargeable Income (MYR)
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rate (%)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {taxBrackets.map((bracket, index) => (
                        <tr key={index}>
                          <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                            {bracket.max
                              ? `${bracket.min.toLocaleString()} - ${bracket.max.toLocaleString()}`
                              : `${bracket.min.toLocaleString()} and above`}
                          </td>
                          <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                            {bracket.rate}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;