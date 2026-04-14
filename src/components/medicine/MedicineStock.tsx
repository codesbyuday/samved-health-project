'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Search,
  AlertTriangle,
  Package,
  TrendingDown,
  Calendar,
  Filter,
  Download,
  Plus,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Loader2,
  Building2,
  User,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  medicineStockService,
  medicinesService,
  hospitalSearchService,
  type MedicineStock,
  type Medicine,
  type Hospital,
  type HospitalStaff,
} from '@/services/database';

type StockStatus = 'in-stock' | 'low-stock' | 'out-of-stock' | 'expiring-soon';

const getStockStatus = (stock: MedicineStock): StockStatus => {
  const quantity = stock.quantity ?? 0;
  const threshold = stock.threshold ?? 0;
  const expiryDate = stock.expiry_date;

  if (quantity === 0) return 'out-of-stock';
  if (quantity < threshold) return 'low-stock';
  if (expiryDate && new Date(expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) {
    return 'expiring-soon';
  }
  return 'in-stock';
};

const stockStatusConfig: Record<StockStatus, { color: string; label: string; bgColor: string }> = {
  'in-stock': {
    color: 'text-green-700',
    label: 'In Stock',
    bgColor: 'bg-green-100',
  },
  'low-stock': {
    color: 'text-amber-700',
    label: 'Low Stock',
    bgColor: 'bg-amber-100',
  },
  'out-of-stock': {
    color: 'text-red-700',
    label: 'Out of Stock',
    bgColor: 'bg-red-100',
  },
  'expiring-soon': {
    color: 'text-orange-700',
    label: 'Expiring Soon',
    bgColor: 'bg-orange-100',
  },
};

export default function MedicineStockComponent() {
  // State for stock data
  const [stockData, setStockData] = useState<MedicineStock[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Dialog states
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedStock, setSelectedStock] = useState<MedicineStock | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    medicine_id: '',
    quantity: '',
    threshold: '',
    expiry_date: '',
    hospital_id: '',
  });

  // Hospital search
  const [hospitalSearch, setHospitalSearch] = useState('');
  const [hospitalResults, setHospitalResults] = useState<Hospital[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [isSearchingHospitals, setIsSearchingHospitals] = useState(false);

  // Medicine search
  const [medicineSearch, setMedicineSearch] = useState('');
  const [medicineResults, setMedicineResults] = useState<Medicine[]>([]);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [isSearchingMedicines, setIsSearchingMedicines] = useState(false);

  // Load stock data
  const loadStockData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await medicineStockService.getAll();
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
      } else {
        setStockData(result.data || []);
      }
    } catch (err) {
      console.error('Error loading medicine stock:', err);
      setError('Failed to load medicine stock data');
      toast.error('Failed to load medicine stock data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load medicines list
  const loadMedicines = useCallback(async () => {
    try {
      const result = await medicinesService.getAll();
      if (result.data) {
        setMedicines(result.data);
      }
    } catch (err) {
      console.error('Error loading medicines:', err);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadStockData();
    loadMedicines();
  }, [loadStockData, loadMedicines]);

  // Hospital search effect
  useEffect(() => {
    const searchHospitals = async () => {
      if (!hospitalSearch.trim()) {
        setHospitalResults([]);
        return;
      }
      setIsSearchingHospitals(true);
      try {
        const { data, error } = await hospitalSearchService.search(hospitalSearch);
        if (!error && data) {
          setHospitalResults(data);
        }
      } catch (err) {
        console.error('Hospital search error:', err);
      }
      setIsSearchingHospitals(false);
    };
    const timer = setTimeout(searchHospitals, 300);
    return () => clearTimeout(timer);
  }, [hospitalSearch]);

  // Medicine search effect
  useEffect(() => {
    const searchMedicines = async () => {
      if (!medicineSearch.trim()) {
        setMedicineResults([]);
        return;
      }
      setIsSearchingMedicines(true);
      try {
        const { data, error } = await medicinesService.search(medicineSearch);
        if (!error && data) {
          setMedicineResults(data);
        }
      } catch (err) {
        console.error('Medicine search error:', err);
      }
      setIsSearchingMedicines(false);
    };
    const timer = setTimeout(searchMedicines, 300);
    return () => clearTimeout(timer);
  }, [medicineSearch]);

  // Get unique categories from stock data
  const categories = useMemo(() => {
    const cats = new Set(
      stockData
        .map((s) => s.medicine?.medicine_category)
        .filter((cat): cat is string => !!cat)
    );
    return Array.from(cats).sort();
  }, [stockData]);

  // Filter stock data
  const filteredStock = useMemo(() => {
    return stockData.filter((stock) => {
      const medicine = stock.medicine;
      const matchesSearch =
        !searchQuery.trim() ||
        medicine?.medicine_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        medicine?.medicine_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        medicine?.manufacturer_name?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        categoryFilter === 'all' || medicine?.medicine_category === categoryFilter;

      const status = getStockStatus(stock);
      const matchesStatus = statusFilter === 'all' || status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [stockData, searchQuery, categoryFilter, statusFilter]);

  // Calculate stock summary
  const stockSummary = useMemo(() => {
    const total = stockData.length;
    const lowStock = stockData.filter((s) => getStockStatus(s) === 'low-stock').length;
    const outOfStock = stockData.filter((s) => getStockStatus(s) === 'out-of-stock').length;
    const expiringSoon = stockData.filter((s) => getStockStatus(s) === 'expiring-soon').length;
    const inStock = total - lowStock - outOfStock;
    return { total, lowStock, outOfStock, expiringSoon, inStock };
  }, [stockData]);

  // Reset form
  const resetForm = () => {
    setFormData({
      medicine_id: '',
      quantity: '',
      threshold: '',
      expiry_date: '',
      hospital_id: '',
    });
    setSelectedMedicine(null);
    setSelectedHospital(null);
    setMedicineSearch('');
    setHospitalSearch('');
  };

  // Open view dialog
  const openViewDialog = (stock: MedicineStock) => {
    setSelectedStock(stock);
    setShowViewDialog(true);
  };

  // Open edit dialog
  const openEditDialog = (stock: MedicineStock) => {
    setSelectedStock(stock);
    setFormData({
      medicine_id: stock.medicine_id || '',
      quantity: String(stock.quantity ?? ''),
      threshold: String(stock.threshold ?? ''),
      expiry_date: stock.expiry_date || '',
      hospital_id: stock.hospital_id || '',
    });
    if (stock.medicine) {
      setSelectedMedicine(stock.medicine);
    }
    if (stock.hospital) {
      setSelectedHospital(stock.hospital);
    }
    setShowEditDialog(true);
  };

  // Open add dialog
  const openAddDialog = () => {
    resetForm();
    setShowAddDialog(true);
  };

  // Open delete dialog
  const openDeleteDialog = (stock: MedicineStock) => {
    setSelectedStock(stock);
    setShowDeleteDialog(true);
  };

  // Handle add stock
  const handleAddStock = async () => {
    if (!selectedMedicine) {
      toast.error('Please select a medicine');
      return;
    }
    if (!formData.quantity || parseInt(formData.quantity) < 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await medicineStockService.create({
        medicine_id: selectedMedicine.medicine_id,
        quantity: parseInt(formData.quantity),
        threshold: formData.threshold ? parseInt(formData.threshold) : null,
        expiry_date: formData.expiry_date || null,
        hospital_id: selectedHospital?.hospital_id || null,
      });

      if (error) {
        toast.error(error);
      } else {
        toast.success('Medicine stock added successfully');
        setShowAddDialog(false);
        resetForm();
        loadStockData();
      }
    } catch (err) {
      toast.error('Failed to add medicine stock');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit stock
  const handleEditStock = async () => {
    if (!selectedStock) return;
    if (!formData.quantity || parseInt(formData.quantity) < 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await medicineStockService.update(selectedStock.stock_id, {
        medicine_id: selectedMedicine?.medicine_id || selectedStock.medicine_id,
        quantity: parseInt(formData.quantity),
        threshold: formData.threshold ? parseInt(formData.threshold) : null,
        expiry_date: formData.expiry_date || null,
        hospital_id: selectedHospital?.hospital_id || null,
      });

      if (error) {
        toast.error(error);
      } else {
        toast.success('Medicine stock updated successfully');
        setShowEditDialog(false);
        setSelectedStock(null);
        resetForm();
        loadStockData();
      }
    } catch (err) {
      toast.error('Failed to update medicine stock');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete stock
  const handleDeleteStock = async () => {
    if (!selectedStock) return;

    setIsSubmitting(true);
    try {
      const { error } = await medicineStockService.delete(selectedStock.stock_id);
      if (error) {
        toast.error(error);
      } else {
        toast.success('Medicine stock deleted successfully');
        setShowDeleteDialog(false);
        setSelectedStock(null);
        loadStockData();
      }
    } catch (err) {
      toast.error('Failed to delete medicine stock');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle card click for filtering
  const handleCardClick = (status: 'all' | 'in-stock' | 'low-stock' | 'out-of-stock' | 'expiring-soon') => {
    if (status === 'all') {
      setStatusFilter('all');
    } else {
      setStatusFilter(status);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Medicine Stock</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Monitor and manage hospital medicine inventory
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadStockData}>
            <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
            Refresh
          </Button>
          <Button onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Stock
          </Button>
        </div>
      </div>

      {/* Alert Banner */}
      {stockSummary.lowStock + stockSummary.outOfStock > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
          <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800 dark:text-red-200">Stock Alert</p>
            <p className="mt-1 text-sm text-red-700 dark:text-red-300">
              {stockSummary.outOfStock > 0 && `${stockSummary.outOfStock} medicine(s) out of stock. `}
              {stockSummary.lowStock > 0 && `${stockSummary.lowStock} medicine(s) running low. `}
              Please reorder immediately.
            </p>
          </div>
        </div>
      )}

      {/* Summary Cards - Clickable */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card
          className={cn(
            'border-l-4 border-l-green-500 cursor-pointer transition-all hover:shadow-md',
            statusFilter === 'in-stock' && 'ring-2 ring-green-300 bg-green-50/50 dark:bg-green-950/20'
          )}
          onClick={() => handleCardClick('in-stock')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">In Stock</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stockSummary.inStock}</p>
              </div>
              <div className="rounded-lg bg-green-50 p-2 dark:bg-green-950/30">
                <Package className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            'border-l-4 border-l-amber-500 cursor-pointer transition-all hover:shadow-md',
            statusFilter === 'low-stock' && 'ring-2 ring-amber-300 bg-amber-50/50 dark:bg-amber-950/20'
          )}
          onClick={() => handleCardClick('low-stock')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Low Stock</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{stockSummary.lowStock}</p>
              </div>
              <div className="rounded-lg bg-amber-50 p-2 dark:bg-amber-950/30">
                <TrendingDown className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            'border-l-4 border-l-red-500 cursor-pointer transition-all hover:shadow-md',
            statusFilter === 'out-of-stock' && 'ring-2 ring-red-300 bg-red-50/50 dark:bg-red-950/20'
          )}
          onClick={() => handleCardClick('out-of-stock')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{stockSummary.outOfStock}</p>
              </div>
              <div className="rounded-lg bg-red-50 p-2 dark:bg-red-950/30">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            'border-l-4 border-l-orange-500 cursor-pointer transition-all hover:shadow-md',
            statusFilter === 'expiring-soon' && 'ring-2 ring-orange-300 bg-orange-50/50 dark:bg-orange-950/20'
          )}
          onClick={() => handleCardClick('expiring-soon')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Expiring Soon</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{stockSummary.expiringSoon}</p>
              </div>
              <div className="rounded-lg bg-orange-50 p-2 dark:bg-orange-950/30">
                <Calendar className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter indicator */}
      {statusFilter !== 'all' && (
        <div className="flex items-center gap-2 rounded-lg bg-slate-100 p-2 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <span>Filtered:</span>
          <Badge variant="secondary" className="capitalize">
            {stockStatusConfig[statusFilter as StockStatus]?.label || statusFilter}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 ml-auto"
            onClick={() => setStatusFilter('all')}
          >
            Clear
          </Button>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by medicine name, ID, or manufacturer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="in-stock">In Stock</SelectItem>
                <SelectItem value="low-stock">Low Stock</SelectItem>
                <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                <SelectItem value="expiring-soon">Expiring Soon</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Medicine Table */}
      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-lg">
            Medicine Stock Records
            <span className="text-sm font-normal text-slate-500 ml-2">
              ({filteredStock.length} {filteredStock.length === 1 ? 'record' : 'records'})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-slate-500">Loading medicine stock...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 mx-auto mb-3 text-red-400" />
              <p className="font-medium text-red-600">Error Loading Data</p>
              <p className="text-sm text-slate-500 mt-1">{error}</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={loadStockData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          ) : filteredStock.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Package className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p className="font-medium">No medicine stock found</p>
              <p className="text-sm">
                {searchQuery || categoryFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your filters or search'
                  : 'Click "Add Stock" to add new medicine stock'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-800/80">
                  <TableHead className="font-semibold">Medicine Name</TableHead>
                  <TableHead className="font-semibold">Category</TableHead>
                  <TableHead className="font-semibold">Quantity</TableHead>
                  <TableHead className="font-semibold">Threshold</TableHead>
                  <TableHead className="font-semibold">Stock Level</TableHead>
                  <TableHead className="font-semibold">Expiry</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStock.map((stock) => {
                  const status = getStockStatus(stock);
                  const quantity = stock.quantity ?? 0;
                  const threshold = stock.threshold ?? 10;
                  const stockPercentage = Math.min(100, (quantity / (threshold * 2)) * 100);

                  return (
                    <TableRow key={stock.stock_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/70">
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-800 dark:text-slate-100">
                            {stock.medicine?.medicine_name || 'Unknown Medicine'}
                          </p>
                          <p className="text-xs text-slate-500">
                            {stock.medicine?.medicine_id || stock.medicine_id}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {stock.medicine?.medicine_category || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{quantity}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-500">
                          {threshold}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="w-24">
                          <Progress
                            value={stockPercentage}
                            className={cn(
                              'h-2',
                              stockPercentage < 30 && '[&>div]:bg-red-500',
                              stockPercentage >= 30 && stockPercentage < 60 && '[&>div]:bg-amber-500',
                              stockPercentage >= 60 && '[&>div]:bg-green-500'
                            )}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        {stock.expiry_date ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3 text-slate-400" />
                            {format(new Date(stock.expiry_date), 'MMM yyyy')}
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            stockStatusConfig[status].bgColor,
                            stockStatusConfig[status].color
                          )}
                        >
                          {stockStatusConfig[status].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 hover:bg-slate-100"
                            onClick={() => openViewDialog(stock)}
                            title="View Details"
                          >
                            <Eye className="h-3.5 w-3.5 text-slate-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 hover:bg-emerald-50"
                            onClick={() => openEditDialog(stock)}
                            title="Edit"
                          >
                            <Edit className="h-3.5 w-3.5 text-emerald-700" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 hover:bg-red-50"
                            onClick={() => openDeleteDialog(stock)}
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Stock Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Medicine Stock Details
            </DialogTitle>
          </DialogHeader>
          {selectedStock && (
            <div className="space-y-4 py-4 overflow-y-auto flex-1 min-h-0">
              {/* Medicine Info */}
              <div className="p-3 bg-emerald-50 rounded-lg">
                <h4 className="text-sm font-medium text-emerald-800 mb-1">Medicine</h4>
                <p className="text-lg font-bold text-slate-800">
                  {selectedStock.medicine?.medicine_name || 'Unknown Medicine'}
                </p>
                <p className="text-sm text-slate-500">
                  ID: {selectedStock.medicine?.medicine_id || selectedStock.medicine_id}
                </p>
              </div>

              {/* Basic Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-medium text-slate-500">Category</span>
                  <Badge variant="secondary">
                    {selectedStock.medicine?.medicine_category || 'N/A'}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-medium text-slate-500">Manufacturer</span>
                  <p className="text-sm">{selectedStock.medicine?.manufacturer_name || 'N/A'}</p>
                </div>
              </div>

              {/* Stock Details */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Stock Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1 p-3 bg-green-50 rounded-lg">
                    <span className="text-xs font-medium text-green-700">Quantity</span>
                    <p className="text-2xl font-bold text-green-600">{selectedStock.quantity ?? 0}</p>
                  </div>
                  <div className="space-y-1 p-3 bg-amber-50 rounded-lg">
                    <span className="text-xs font-medium text-amber-700">Threshold</span>
                    <p className="text-2xl font-bold text-amber-600">{selectedStock.threshold ?? 0}</p>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">Current Status</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      stockStatusConfig[getStockStatus(selectedStock)].bgColor,
                      stockStatusConfig[getStockStatus(selectedStock)].color
                    )}
                  >
                    {stockStatusConfig[getStockStatus(selectedStock)].label}
                  </Badge>
                </div>
              </div>

              {/* Dates */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Dates
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-slate-500">Expiry Date</span>
                    <p className="text-sm">
                      {selectedStock.expiry_date
                        ? format(new Date(selectedStock.expiry_date), 'MMM dd, yyyy')
                        : 'Not specified'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-slate-500">Last Updated</span>
                    <p className="text-sm">
                      {selectedStock.last_updated
                        ? format(new Date(selectedStock.last_updated), 'MMM dd, yyyy HH:mm')
                        : 'Never'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Hospital */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Hospital
                </h4>
                <p className="text-sm">
                  {selectedStock.hospital?.name || selectedStock.hospital_id || 'Not assigned'}
                </p>
              </div>

              {/* Staff Information */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Staff Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1 p-3 bg-green-50 rounded-lg">
                    <span className="text-xs font-medium text-green-700">Added By</span>
                    {selectedStock.added_by_staff ? (
                      <>
                        <p className="text-sm font-medium">{selectedStock.added_by_staff.name || 'Unknown'}</p>
                        <p className="text-xs text-slate-500">
                          ID: {selectedStock.added_by_staff.staff_id || 'N/A'}
                        </p>
                        {selectedStock.added_by_staff.designation && (
                          <p className="text-xs text-slate-500">{selectedStock.added_by_staff.designation}</p>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-slate-500">Not recorded</p>
                    )}
                  </div>
                  <div className="space-y-1 p-3 bg-emerald-50 rounded-lg">
                    <span className="text-xs font-medium text-emerald-800">Updated By</span>
                    {selectedStock.updated_by_staff ? (
                      <>
                        <p className="text-sm font-medium">{selectedStock.updated_by_staff.name || 'Unknown'}</p>
                        <p className="text-xs text-slate-500">
                          ID: {selectedStock.updated_by_staff.staff_id || 'N/A'}
                        </p>
                        {selectedStock.updated_by_staff.designation && (
                          <p className="text-xs text-slate-500">{selectedStock.updated_by_staff.designation}</p>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-slate-500">Not recorded</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="shrink-0 border-t pt-4 mt-2">
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setShowViewDialog(false);
              if (selectedStock) openEditDialog(selectedStock);
            }}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Stock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Stock Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Medicine Stock</DialogTitle>
            <DialogDescription>Add new medicine stock to the inventory.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Medicine Selector */}
            <div className="space-y-2">
              <Label>Medicine *</Label>
              <div className="relative">
                <Input
                  placeholder="Search medicine..."
                  value={selectedMedicine ? selectedMedicine.medicine_name || '' : medicineSearch}
                  onChange={(e) => {
                    setMedicineSearch(e.target.value);
                    setSelectedMedicine(null);
                  }}
                  className={!selectedMedicine ? 'pl-3' : ''}
                  disabled={!!selectedMedicine}
                />
                {isSearchingMedicines && (
                  <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
                )}
              </div>
              {medicineResults.length > 0 && !selectedMedicine && (
                <div className="border rounded-lg divide-y max-h-40 overflow-auto bg-white shadow-lg z-50 relative">
                  {medicineResults.map((med) => (
                    <button
                      key={med.medicine_id}
                      className="w-full flex items-center gap-3 p-2 hover:bg-slate-50 text-left"
                      onClick={() => {
                        setSelectedMedicine(med);
                        setMedicineSearch('');
                      }}
                    >
                      <div>
                        <p className="font-medium text-sm">{med.medicine_name}</p>
                        <p className="text-xs text-slate-500">{med.medicine_id} • {med.medicine_category}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {selectedMedicine && (
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border">
                  <Package className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{selectedMedicine.medicine_name}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-auto h-6 px-2"
                    onClick={() => setSelectedMedicine(null)}
                  >
                    Change
                  </Button>
                </div>
              )}
            </div>

            {/* Hospital Selector */}
            <div className="space-y-2">
              <Label>Hospital</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search hospital..."
                  value={selectedHospital ? selectedHospital.name || '' : hospitalSearch}
                  onChange={(e) => {
                    setHospitalSearch(e.target.value);
                    setSelectedHospital(null);
                  }}
                  className="pl-10"
                  disabled={!!selectedHospital}
                />
                {isSearchingHospitals && (
                  <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
                )}
              </div>
              {hospitalResults.length > 0 && !selectedHospital && (
                <div className="border rounded-lg divide-y max-h-40 overflow-auto bg-white shadow-lg z-50 relative">
                  {hospitalResults.map((hospital) => (
                    <button
                      key={hospital.hospital_id}
                      className="w-full flex items-center gap-3 p-2 hover:bg-slate-50 text-left"
                      onClick={() => {
                        setSelectedHospital(hospital);
                        setHospitalSearch('');
                      }}
                    >
                      <Building2 className="h-4 w-4 text-slate-400" />
                      <span className="text-sm">{hospital.name}</span>
                    </button>
                  ))}
                </div>
              )}
              {selectedHospital && (
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border">
                  <Building2 className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{selectedHospital.name}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-auto h-6 px-2"
                    onClick={() => setSelectedHospital(null)}
                  >
                    Change
                  </Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantity *</Label>
                <Input
                  type="number"
                  placeholder="e.g., 100"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Threshold</Label>
                <Input
                  type="number"
                  placeholder="e.g., 10"
                  value={formData.threshold}
                  onChange={(e) => setFormData(prev => ({ ...prev, threshold: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Expiry Date</Label>
              <Input
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAddStock} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Stock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Stock Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Medicine Stock</DialogTitle>
            <DialogDescription>Update medicine stock details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Medicine Selector */}
            <div className="space-y-2">
              <Label>Medicine</Label>
              <div className="relative">
                <Input
                  placeholder="Search medicine..."
                  value={selectedMedicine ? selectedMedicine.medicine_name || '' : medicineSearch}
                  onChange={(e) => {
                    setMedicineSearch(e.target.value);
                    setSelectedMedicine(null);
                  }}
                  disabled={!!selectedMedicine}
                />
                {isSearchingMedicines && (
                  <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
                )}
              </div>
              {medicineResults.length > 0 && !selectedMedicine && (
                <div className="border rounded-lg divide-y max-h-40 overflow-auto bg-white shadow-lg z-50 relative">
                  {medicineResults.map((med) => (
                    <button
                      key={med.medicine_id}
                      className="w-full flex items-center gap-3 p-2 hover:bg-slate-50 text-left"
                      onClick={() => {
                        setSelectedMedicine(med);
                        setMedicineSearch('');
                      }}
                    >
                      <div>
                        <p className="font-medium text-sm">{med.medicine_name}</p>
                        <p className="text-xs text-slate-500">{med.medicine_id} • {med.medicine_category}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {selectedMedicine && (
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border">
                  <Package className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{selectedMedicine.medicine_name}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-auto h-6 px-2"
                    onClick={() => setSelectedMedicine(null)}
                  >
                    Change
                  </Button>
                </div>
              )}
            </div>

            {/* Hospital Selector */}
            <div className="space-y-2">
              <Label>Hospital</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search hospital..."
                  value={selectedHospital ? selectedHospital.name || '' : hospitalSearch}
                  onChange={(e) => {
                    setHospitalSearch(e.target.value);
                    setSelectedHospital(null);
                  }}
                  className="pl-10"
                  disabled={!!selectedHospital}
                />
                {isSearchingHospitals && (
                  <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
                )}
              </div>
              {hospitalResults.length > 0 && !selectedHospital && (
                <div className="border rounded-lg divide-y max-h-40 overflow-auto bg-white shadow-lg z-50 relative">
                  {hospitalResults.map((hospital) => (
                    <button
                      key={hospital.hospital_id}
                      className="w-full flex items-center gap-3 p-2 hover:bg-slate-50 text-left"
                      onClick={() => {
                        setSelectedHospital(hospital);
                        setHospitalSearch('');
                      }}
                    >
                      <Building2 className="h-4 w-4 text-slate-400" />
                      <span className="text-sm">{hospital.name}</span>
                    </button>
                  ))}
                </div>
              )}
              {selectedHospital && (
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border">
                  <Building2 className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{selectedHospital.name}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-auto h-6 px-2"
                    onClick={() => setSelectedHospital(null)}
                  >
                    Change
                  </Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantity *</Label>
                <Input
                  type="number"
                  placeholder="e.g., 100"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Threshold</Label>
                <Input
                  type="number"
                  placeholder="e.g., 10"
                  value={formData.threshold}
                  onChange={(e) => setFormData(prev => ({ ...prev, threshold: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Expiry Date</Label>
              <Input
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleEditStock} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Stock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete Medicine Stock
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete stock for{' '}
              <strong>&quot;{selectedStock?.medicine?.medicine_name || 'Unknown Medicine'}&quot;</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDeleteStock}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
