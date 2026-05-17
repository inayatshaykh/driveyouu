import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { toast } from 'sonner';
import { Upload, CheckCircle, XCircle, Clock, FileText } from 'lucide-react';
import type { KYCDocument } from '../../types';

const documentTypes = [
  { type: 'aadhaar', label: 'Aadhaar Card', required: true },
  { type: 'pan', label: 'PAN Card', required: true },
  { type: 'license', label: 'Driving License', required: true },
  { type: 'photo', label: 'Profile Photo', required: true },
  { type: 'rc', label: 'Vehicle RC (if applicable)', required: false },
];

export function KYCUpload() {
  const [documents, setDocuments] = useState<KYCDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingType, setUploadingType] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/driver/kyc', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch documents');
      }

      setDocuments(data.documents);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch documents');
    }
  };

  const handleFileUpload = async (
    documentType: string,
    file: File,
    documentNumber?: string
  ) => {
    setIsLoading(true);
    setUploadingType(documentType);

    try {
      // In production, upload to S3/Cloud Storage first
      // For now, we'll use a mock URL
      const documentUrl = `https://storage.example.com/kyc/${Date.now()}-${file.name}`;

      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/driver/kyc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          documentType,
          documentUrl,
          documentNumber,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload document');
      }

      toast.success('Document uploaded successfully');
      fetchDocuments();
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload document');
    } finally {
      setIsLoading(false);
      setUploadingType(null);
    }
  };

  const getDocumentStatus = (type: string) => {
    const doc = documents.find((d) => d.documentType === type);
    if (!doc) return null;
    return doc.verificationStatus;
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) {
      return <Badge variant="secondary">Not Uploaded</Badge>;
    }

    const statusMap: Record<string, { label: string; variant: any; icon: any }> = {
      pending: {
        label: 'Under Review',
        variant: 'secondary',
        icon: Clock,
      },
      verified: {
        label: 'Verified',
        variant: 'default',
        icon: CheckCircle,
      },
      rejected: {
        label: 'Rejected',
        variant: 'destructive',
        icon: XCircle,
      },
    };

    const statusInfo = statusMap[status] || statusMap.pending;
    const Icon = statusInfo.icon;

    return (
      <Badge variant={statusInfo.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {statusInfo.label}
      </Badge>
    );
  };

  const calculateProgress = () => {
    const requiredDocs = documentTypes.filter((d) => d.required);
    const uploadedDocs = requiredDocs.filter((d) => getDocumentStatus(d.type));
    return (uploadedDocs.length / requiredDocs.length) * 100;
  };

  const progress = calculateProgress();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>KYC Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Verification Progress</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
          </div>

          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">
              Upload all required documents to complete your verification. Our team will
              review your documents within 24-48 hours.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {documentTypes.map((docType) => {
          const status = getDocumentStatus(docType.type);
          const doc = documents.find((d) => d.documentType === docType.type);

          return (
            <Card key={docType.type}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <FileText className="mt-1 h-5 w-5 text-muted-foreground" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{docType.label}</h3>
                        {docType.required && (
                          <Badge variant="outline" className="text-xs">
                            Required
                          </Badge>
                        )}
                      </div>
                      {getStatusBadge(status)}
                      {doc?.rejectionReason && (
                        <p className="text-sm text-destructive">
                          Reason: {doc.rejectionReason}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <input
                      type="file"
                      id={`file-${docType.type}`}
                      className="hidden"
                      accept="image/*,application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const number = prompt(
                            `Enter ${docType.label} number (optional):`
                          );
                          handleFileUpload(docType.type, file, number || undefined);
                        }
                      }}
                      disabled={isLoading}
                    />
                    <Button
                      variant={status ? 'outline' : 'default'}
                      size="sm"
                      onClick={() =>
                        document.getElementById(`file-${docType.type}`)?.click()
                      }
                      disabled={isLoading && uploadingType === docType.type}
                    >
                      {isLoading && uploadingType === docType.type ? (
                        'Uploading...'
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          {status ? 'Re-upload' : 'Upload'}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
