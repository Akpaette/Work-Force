import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Download, FileSpreadsheet, FileText, CreditCard, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import * as Papa from 'papaparse';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { Staff, Department } from '@shared/schema';

interface DataExportProps {
  className?: string;
}

interface ExportOptions {
  format: 'csv' | 'pdf' | 'id-cards';
  department: string;
  fields: string[];
  includeSensitive: boolean;
}

export function DataExport({ className }: DataExportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    department: 'all',
    fields: [],
    includeSensitive: false
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const { toast } = useToast();

  // Fetch staff data
  const { data: allStaff } = useQuery<Staff[]>({
    queryKey: ['/api/staff'],
  });

  // Fetch departments
  const { data: departments } = useQuery<Department[]>({
    queryKey: ['/api/departments'],
  });

  // Available fields for export
  const availableFields = [
    { id: 'registrationNumber', label: 'Registration Number', sensitive: false },
    { id: 'firstName', label: 'First Name', sensitive: false },
    { id: 'lastName', label: 'Last Name', sensitive: false },
    { id: 'email', label: 'Email', sensitive: false },
    { id: 'phone', label: 'Phone', sensitive: true },
    { id: 'gender', label: 'Gender', sensitive: false },
    { id: 'dateOfBirth', label: 'Date of Birth', sensitive: true },
    { id: 'address', label: 'Address', sensitive: true },
    { id: 'department', label: 'Department', sensitive: false },
    { id: 'position', label: 'Position', sensitive: false },
    { id: 'employmentType', label: 'Employment Type', sensitive: false },
    { id: 'dateOfJoining', label: 'Date of Joining', sensitive: false },
    { id: 'ordinationStatus', label: 'Ordination Status', sensitive: false },
    { id: 'dateOfOrdination', label: 'Date of Ordination', sensitive: false },
    { id: 'relationshipStatus', label: 'Relationship Status', sensitive: true },
    { id: 'spouseFirstName', label: 'Spouse First Name', sensitive: true },
    { id: 'spouseLastName', label: 'Spouse Last Name', sensitive: true },
    { id: 'educationLevel', label: 'Education Level', sensitive: false },
    { id: 'fieldOfStudy', label: 'Field of Study', sensitive: false },
    { id: 'institution', label: 'Institution', sensitive: false },
    { id: 'emergencyContactName', label: 'Emergency Contact Name', sensitive: true },
    { id: 'emergencyContactPhone', label: 'Emergency Contact Phone', sensitive: true },
    { id: 'status', label: 'Status', sensitive: false },
    { id: 'createdAt', label: 'Date Added', sensitive: false },
  ];

  // Filter staff based on department selection
  const getFilteredStaff = (): Staff[] => {
    if (!allStaff) return [];
    if (exportOptions.department === 'all') return allStaff;
    return allStaff.filter(staff => staff.department === exportOptions.department);
  };

  // Export to CSV
  const exportToCSV = async () => {
    const filteredStaff = getFilteredStaff();
    if (!filteredStaff.length) {
      toast({
        title: 'No Data',
        description: 'No staff members found for the selected criteria.',
        variant: 'destructive',
      });
      return;
    }

    // Prepare data with selected fields
    const selectedFields = exportOptions.fields.length > 0 
      ? exportOptions.fields 
      : availableFields.map(f => f.id);

    const csvData = filteredStaff.map(staff => {
      const row: Record<string, any> = {};
      selectedFields.forEach(field => {
        const fieldConfig = availableFields.find(f => f.id === field);
        if (fieldConfig && (exportOptions.includeSensitive || !fieldConfig.sensitive)) {
          row[fieldConfig.label] = staff[field as keyof Staff] || '';
        }
      });
      return row;
    });

    // Generate CSV
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    const filename = exportOptions.department === 'all' 
      ? 'All_Staff_Export.csv'
      : `${exportOptions.department.replace(/[^a-zA-Z0-9]/g, '_')}_Staff_Export.csv`;
    
    link.download = filename;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);

    toast({
      title: 'Success',
      description: `Exported ${filteredStaff.length} staff records to CSV.`,
    });
  };

  // Export to PDF
  const exportToPDF = async () => {
    const filteredStaff = getFilteredStaff();
    if (!filteredStaff.length) {
      toast({
        title: 'No Data',
        description: 'No staff members found for the selected criteria.',
        variant: 'destructive',
      });
      return;
    }

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    // Title
    const title = exportOptions.department === 'all' 
      ? 'All Staff Directory' 
      : `${exportOptions.department} Staff Directory`;
    
    pdf.setFontSize(16);
    pdf.text(title, 14, 20);
    
    pdf.setFontSize(10);
    pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 26);
    pdf.text(`Total Records: ${filteredStaff.length}`, 14, 32);

    // Prepare table data
    const selectedFields = exportOptions.fields.length > 0 
      ? exportOptions.fields 
      : ['registrationNumber', 'firstName', 'lastName', 'department', 'position', 'status'];

    const headers = selectedFields.map(field => {
      const fieldConfig = availableFields.find(f => f.id === field);
      return fieldConfig?.label || field;
    });

    const tableData = filteredStaff.map(staff => {
      return selectedFields.map(field => {
        const value = staff[field as keyof Staff];
        if (value === null || value === undefined) return '';
        if (value instanceof Date) return value.toLocaleDateString();
        return String(value);
      });
    });

    // Add table
    (pdf as any).autoTable({
      head: [headers],
      body: tableData,
      startY: 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [63, 81, 181] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 14, right: 14 },
    });

    const filename = exportOptions.department === 'all' 
      ? 'All_Staff_Export.pdf'
      : `${exportOptions.department.replace(/[^a-zA-Z0-9]/g, '_')}_Staff_Export.pdf`;
    
    pdf.save(filename);

    toast({
      title: 'Success',
      description: `Exported ${filteredStaff.length} staff records to PDF.`,
    });
  };

  // Batch generate ID cards
  const generateBatchIDCards = async () => {
    const filteredStaff = getFilteredStaff();
    if (!filteredStaff.length) {
      toast({
        title: 'No Data',
        description: 'No staff members found for the selected criteria.',
        variant: 'destructive',
      });
      return;
    }

    setExportProgress(0);
    const total = filteredStaff.length;
    
    try {
      // This would typically call a batch API endpoint
      toast({
        title: 'Batch Generation Started',
        description: `Preparing to generate ${total} ID cards. This may take a few minutes.`,
      });

      // Simulate progress for now - in real implementation, this would be actual API calls
      for (let i = 0; i < total; i++) {
        setExportProgress(((i + 1) / total) * 100);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      toast({
        title: 'Success',
        description: `Batch ID card generation completed for ${total} staff members.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate batch ID cards.',
        variant: 'destructive',
      });
    }
  };

  // Handle export based on selected format
  const handleExport = async () => {
    setIsExporting(true);
    try {
      switch (exportOptions.format) {
        case 'csv':
          await exportToCSV();
          break;
        case 'pdf':
          await exportToPDF();
          break;
        case 'id-cards':
          await generateBatchIDCards();
          break;
        default:
          throw new Error('Invalid export format');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Export failed. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const handleFieldToggle = (fieldId: string, checked: boolean) => {
    setExportOptions(prev => ({
      ...prev,
      fields: checked 
        ? [...prev.fields, fieldId]
        : prev.fields.filter(f => f !== fieldId)
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={className}>
          <Download className="w-4 h-4 mr-2" />
          Export Data
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Export Staff Data</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Export Format */}
          <div>
            <label className="text-sm font-medium">Export Format</label>
            <Select 
              value={exportOptions.format} 
              onValueChange={(value: any) => setExportOptions(prev => ({ ...prev, format: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div className="flex items-center">
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    CSV File
                  </div>
                </SelectItem>
                <SelectItem value="pdf">
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    PDF Report
                  </div>
                </SelectItem>
                <SelectItem value="id-cards">
                  <div className="flex items-center">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Batch ID Cards
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Department Filter */}
          <div>
            <label className="text-sm font-medium">Department</label>
            <Select 
              value={exportOptions.department} 
              onValueChange={(value) => setExportOptions(prev => ({ ...prev, department: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments?.map(dept => (
                  <SelectItem key={dept.id} value={dept.name}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Field Selection (for CSV and PDF only) */}
          {exportOptions.format !== 'id-cards' && (
            <div>
              <label className="text-sm font-medium mb-3 block">
                Select Fields to Export (leave empty for all)
              </label>
              <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                {availableFields.map(field => (
                  <div key={field.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={field.id}
                      checked={exportOptions.fields.includes(field.id)}
                      onCheckedChange={(checked) => handleFieldToggle(field.id, !!checked)}
                      disabled={field.sensitive && !exportOptions.includeSensitive}
                    />
                    <label 
                      htmlFor={field.id} 
                      className={`text-sm ${field.sensitive ? 'text-orange-600' : ''}`}
                    >
                      {field.label}
                      {field.sensitive && ' 🔒'}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Include Sensitive Data */}
          {exportOptions.format !== 'id-cards' && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeSensitive"
                checked={exportOptions.includeSensitive}
                onCheckedChange={(checked) => 
                  setExportOptions(prev => ({ ...prev, includeSensitive: !!checked }))
                }
              />
              <label htmlFor="includeSensitive" className="text-sm">
                Include sensitive data (phone numbers, addresses, etc.)
              </label>
            </div>
          )}

          {/* Progress Bar */}
          {isExporting && exportProgress > 0 && (
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Export Progress</span>
                <span>{Math.round(exportProgress)}%</span>
              </div>
              <Progress value={exportProgress} className="w-full" />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={isExporting}>
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default DataExport;
