import { useState, useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useBackupRestore } from "@/hooks/useBackupRestore";
import { Download, Upload, AlertTriangle, FileJson, CheckCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

export default function BackupRestorePage() {
  const { isExporting, isImporting, downloadBackup, validateBackup, restoreData } = useBackupRestore();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingBackupData, setPendingBackupData] = useState<any>(null);
  const [backupSummary, setBackupSummary] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        if (!validateBackup(data)) {
          toast({
            title: "Invalid Backup File",
            description: "The selected file is not a valid backup.",
            variant: "destructive"
          });
          return;
        }

        setPendingBackupData(data);
        setBackupSummary({
          exportedAt: new Date(data.exportedAt).toLocaleString(),
          rawMaterials: data.raw_materials.length,
          products: data.products.length,
          bom: data.bom.length,
          productionBatches: data.production_batches.length,
          customers: data.customers.length,
          sellers: data.sellers.length
        });
        setShowConfirmDialog(true);
      } catch (error) {
        toast({
          title: "Invalid File",
          description: "Could not parse the backup file.",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
    
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirmRestore = async () => {
    if (!pendingBackupData) return;
    
    setShowConfirmDialog(false);
    const success = await restoreData(pendingBackupData);
    
    if (success) {
      setPendingBackupData(null);
      setBackupSummary(null);
    }
  };

  const handleCancelRestore = () => {
    setShowConfirmDialog(false);
    setPendingBackupData(null);
    setBackupSummary(null);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Backup & Restore</h1>
          <p className="text-muted-foreground">
            Export your data as JSON or restore from a previous backup
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Export Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5 text-primary" />
                Export Backup
              </CardTitle>
              <CardDescription>
                Download a complete backup of all your data as a JSON file
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-4 text-sm">
                <p className="font-medium mb-2">This backup includes:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Raw Materials</li>
                  <li>Products</li>
                  <li>Bill of Materials (BOM)</li>
                  <li>Production Batches</li>
                  <li>Stock Ledger Entries</li>
                  <li>Customers & Sellers</li>
                </ul>
              </div>
              <Button 
                onClick={downloadBackup} 
                disabled={isExporting}
                className="w-full"
              >
                {isExporting ? (
                  <>Exporting...</>
                ) : (
                  <>
                    <FileJson className="mr-2 h-4 w-4" />
                    Download Backup
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Import Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                Restore Backup
              </CardTitle>
              <CardDescription>
                Restore your data from a previously exported backup file
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm">
                <div className="flex gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
                  <div>
                    <p className="font-medium text-destructive">Warning</p>
                    <p className="text-muted-foreground">
                      Restoring will overwrite ALL existing data. This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
              <input
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                ref={fileInputRef}
                className="hidden"
              />
              <Button 
                variant="outline"
                onClick={() => fileInputRef.current?.click()} 
                disabled={isImporting}
                className="w-full"
              >
                {isImporting ? (
                  <>Restoring...</>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Select Backup File
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Tips Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              Backup Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Create regular backups before major changes
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Store backups in a secure location
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Test restores on a development environment first
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Keep multiple versions of backups
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirm Restore
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  Are you sure you want to restore from this backup? This will <strong>permanently delete</strong> all current data and replace it with the backup data.
                </p>
                
                {backupSummary && (
                  <div className="rounded-lg border bg-muted/50 p-4 text-sm">
                    <p className="font-medium mb-2">Backup Summary:</p>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>Exported: {backupSummary.exportedAt}</li>
                      <li>Raw Materials: {backupSummary.rawMaterials}</li>
                      <li>Products: {backupSummary.products}</li>
                      <li>BOMs: {backupSummary.bom}</li>
                      <li>Production Batches: {backupSummary.productionBatches}</li>
                      <li>Customers: {backupSummary.customers}</li>
                      <li>Sellers: {backupSummary.sellers}</li>
                    </ul>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelRestore}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmRestore}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, Restore Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
