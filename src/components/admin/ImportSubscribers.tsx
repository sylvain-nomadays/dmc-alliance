'use client';

/**
 * ImportSubscribers Component
 * Modal to import subscribers from CSV file
 */

import { useState, useCallback } from 'react';

interface ImportedRow {
  email: string;
  company_name?: string;
  locale?: string;
}

interface ImportResult {
  imported: number;
  skipped: number;
  errors: number;
  total: number;
}

interface ImportSubscribersProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ImportSubscribers({ isOpen, onClose, onSuccess }: ImportSubscribersProps) {
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'result'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ImportedRow[]>([]);
  const [columnMapping, setColumnMapping] = useState<{
    email: string;
    company_name: string;
    locale: string;
  }>({
    email: '',
    company_name: '',
    locale: '',
  });
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

  // Parse CSV file
  const parseCSV = useCallback((content: string) => {
    const lines = content.split(/\r?\n/).filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('Le fichier doit contenir au moins une ligne d\'en-tête et une ligne de données');
    }

    // Parse header
    const header = lines[0].split(/[,;]/).map(h => h.trim().replace(/^["']|["']$/g, ''));
    setAvailableColumns(header);

    // Auto-detect columns
    const emailCol = header.find(h =>
      h.toLowerCase().includes('email') || h.toLowerCase().includes('mail')
    );
    const companyCol = header.find(h =>
      h.toLowerCase().includes('company') ||
      h.toLowerCase().includes('entreprise') ||
      h.toLowerCase().includes('societe') ||
      h.toLowerCase().includes('société')
    );
    const localeCol = header.find(h =>
      h.toLowerCase().includes('locale') ||
      h.toLowerCase().includes('langue') ||
      h.toLowerCase().includes('language')
    );

    setColumnMapping({
      email: emailCol || '',
      company_name: companyCol || '',
      locale: localeCol || '',
    });

    // Parse data rows
    const data: ImportedRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(/[,;]/).map(v => v.trim().replace(/^["']|["']$/g, ''));

      const row: Record<string, string> = {};
      header.forEach((h, idx) => {
        row[h] = values[idx] || '';
      });

      data.push({
        email: row[emailCol || ''] || '',
        company_name: row[companyCol || ''] || '',
        locale: row[localeCol || ''] || 'fr',
      });
    }

    return data;
  }, []);

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setError('');
    setFile(uploadedFile);

    try {
      const content = await uploadedFile.text();
      const data = parseCSV(content);
      setParsedData(data);
      setStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la lecture du fichier');
    }
  };

  // Re-parse with updated column mapping
  const updatePreview = useCallback(() => {
    if (!file) return;

    file.text().then(content => {
      const lines = content.split(/\r?\n/).filter(line => line.trim());
      const header = lines[0].split(/[,;]/).map(h => h.trim().replace(/^["']|["']$/g, ''));

      const data: ImportedRow[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(/[,;]/).map(v => v.trim().replace(/^["']|["']$/g, ''));

        const row: Record<string, string> = {};
        header.forEach((h, idx) => {
          row[h] = values[idx] || '';
        });

        data.push({
          email: row[columnMapping.email] || '',
          company_name: row[columnMapping.company_name] || '',
          locale: row[columnMapping.locale] || 'fr',
        });
      }

      setParsedData(data);
    });
  }, [file, columnMapping]);

  // Handle import
  const handleImport = async () => {
    setStep('importing');
    setProgress(0);

    // Filter valid emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validData = parsedData.filter(row => emailRegex.test(row.email));

    if (validData.length === 0) {
      setError('Aucun email valide trouvé dans le fichier');
      setStep('preview');
      return;
    }

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('/api/admin/newsletter/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscribers: validData,
          skipDuplicates,
        }),
      });

      clearInterval(progressInterval);
      setProgress(100);

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de l\'import');
      }

      setImportResult(result);
      setStep('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'import');
      setStep('preview');
    }
  };

  // Reset and close
  const handleClose = () => {
    setStep('upload');
    setFile(null);
    setParsedData([]);
    setColumnMapping({ email: '', company_name: '', locale: '' });
    setAvailableColumns([]);
    setSkipDuplicates(true);
    setImportResult(null);
    setError('');
    setProgress(0);
    onClose();
  };

  // Handle success and close
  const handleSuccess = () => {
    onSuccess();
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Importer des contacts
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Error message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Téléchargez votre fichier CSV
                </h3>
                <p className="text-gray-600 text-sm">
                  Le fichier doit contenir au minimum une colonne &quot;email&quot;.
                  <br />
                  Colonnes optionnelles : company, locale (fr/en)
                </p>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-terracotta-500 transition-colors">
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="csv-upload"
                />
                <label
                  htmlFor="csv-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm font-medium text-terracotta-600">
                    Cliquez pour sélectionner un fichier
                  </span>
                  <span className="text-xs text-gray-500 mt-1">
                    CSV ou TXT, max 5MB
                  </span>
                </label>
              </div>

              {/* Sample format */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Format attendu :</h4>
                <code className="text-xs text-gray-600 block font-mono">
                  email,company,locale<br />
                  john@example.com,ACME Corp,fr<br />
                  jane@example.com,Tech Inc,en
                </code>
              </div>
            </div>
          )}

          {/* Step 2: Preview */}
          {step === 'preview' && (
            <div className="space-y-6">
              {/* File info */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div>
                  <p className="font-medium text-gray-900">{file?.name}</p>
                  <p className="text-sm text-gray-500">
                    {parsedData.length} lignes détectées
                  </p>
                </div>
              </div>

              {/* Column mapping */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Correspondance des colonnes
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Email *
                    </label>
                    <select
                      value={columnMapping.email}
                      onChange={(e) => {
                        setColumnMapping(prev => ({ ...prev, email: e.target.value }));
                        setTimeout(updatePreview, 0);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-terracotta-500"
                    >
                      <option value="">Sélectionner...</option>
                      {availableColumns.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Entreprise
                    </label>
                    <select
                      value={columnMapping.company_name}
                      onChange={(e) => {
                        setColumnMapping(prev => ({ ...prev, company_name: e.target.value }));
                        setTimeout(updatePreview, 0);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-terracotta-500"
                    >
                      <option value="">Aucune</option>
                      {availableColumns.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Langue
                    </label>
                    <select
                      value={columnMapping.locale}
                      onChange={(e) => {
                        setColumnMapping(prev => ({ ...prev, locale: e.target.value }));
                        setTimeout(updatePreview, 0);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-terracotta-500"
                    >
                      <option value="">FR par défaut</option>
                      {availableColumns.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Preview table */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Aperçu (5 premières lignes)
                </h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">Email</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">Entreprise</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">Langue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {parsedData.slice(0, 5).map((row, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2 text-gray-900">{row.email || '-'}</td>
                          <td className="px-4 py-2 text-gray-600">{row.company_name || '-'}</td>
                          <td className="px-4 py-2 text-gray-600">{row.locale || 'fr'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsedData.length > 5 && (
                  <p className="text-xs text-gray-500 mt-2">
                    + {parsedData.length - 5} autres lignes
                  </p>
                )}
              </div>

              {/* Options */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="skipDuplicates"
                  checked={skipDuplicates}
                  onChange={(e) => setSkipDuplicates(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-terracotta-500 focus:ring-terracotta-500"
                />
                <label htmlFor="skipDuplicates" className="text-sm text-gray-700">
                  Ignorer les emails déjà existants
                </label>
              </div>
            </div>
          )}

          {/* Step 3: Importing */}
          {step === 'importing' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4">
                <svg className="animate-spin h-16 w-16 text-terracotta-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Import en cours...
              </h3>
              <div className="w-full max-w-xs mx-auto bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className="bg-terracotta-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-500">
                {progress}% - Veuillez patienter
              </p>
            </div>
          )}

          {/* Step 4: Result */}
          {step === 'result' && importResult && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Import terminé !
              </h3>

              <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto mb-6">
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{importResult.imported}</p>
                  <p className="text-xs text-green-700">Importés</p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">{importResult.skipped}</p>
                  <p className="text-xs text-yellow-700">Ignorés</p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{importResult.errors}</p>
                  <p className="text-xs text-red-700">Erreurs</p>
                </div>
              </div>

              <p className="text-sm text-gray-600">
                {importResult.imported} contacts ont été ajoutés à votre base de données.
                {importResult.skipped > 0 && (
                  <> {importResult.skipped} emails existants ont été ignorés.</>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          {step === 'upload' && (
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Annuler
            </button>
          )}

          {step === 'preview' && (
            <>
              <button
                onClick={() => setStep('upload')}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Retour
              </button>
              <button
                onClick={handleImport}
                disabled={!columnMapping.email}
                className="px-4 py-2 bg-terracotta-500 hover:bg-terracotta-600 disabled:bg-gray-300 text-white rounded-lg transition-colors"
              >
                Importer {parsedData.length} contacts
              </button>
            </>
          )}

          {step === 'result' && (
            <button
              onClick={handleSuccess}
              className="px-4 py-2 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-lg transition-colors"
            >
              Fermer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
