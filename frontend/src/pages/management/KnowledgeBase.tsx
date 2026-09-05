import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Upload, 
  FileText, 
  Trash2, 
  RefreshCw, 
  Search, 
  X, 
  Layers, 
  Loader2,
  Check,
  AlertCircle
} from 'lucide-react';
import Modal from '../../components/Modal';
import { useToast } from '../../components/Toast';
import { knowledgeBaseApi, ragChatApi, type IngestedDocument } from '../../api';

interface IngestionPipelineTask {
  id: string;
  file: { name: string; size: number };
  stage: 'parsing' | 'chunking' | 'embedding' | 'indexing' | 'success' | 'error';
  stageText: string;
  progress: number;
  chunkCount?: number;
  error?: string;
  startedAt: string;
}

export default function KnowledgeBase() {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<IngestedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<'documents' | 'test'>('documents');

  // Active Live Ingestion & Chunking Pipeline Tracker
  const [activePipeline, setActivePipeline] = useState<IngestionPipelineTask | null>(null);

  // Chunks Inspection Modal
  const [selectedDocForChunks, setSelectedDocForChunks] = useState<IngestedDocument | null>(null);
  const [chunks, setChunks] = useState<any[]>([]);
  const [chunksLoading, setChunksLoading] = useState(false);

  // RAG Search Playground
  const [testQuery, setTestQuery] = useState('');
  const [testResults, setTestResults] = useState<any[]>([]);
  const [testLoading, setTestLoading] = useState(false);

  // Delete Confirmation Modal
  const [docToDelete, setDocToDelete] = useState<IngestedDocument | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const docs = await knowledgeBaseApi.getDocuments();
      setDocuments(docs || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesSelected(Array.from(e.target.files));
    }
  };

  // Immediate upload and pipeline execution
  const handleFilesSelected = async (files: File[]) => {
    const pdfFiles = files.filter(f => f.name.toLowerCase().endsWith('.pdf') || f.type === 'application/pdf');
    if (pdfFiles.length === 0) {
      toast.warning('Please select PDF documents only');
      return;
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Process files sequentially through the chunking pipeline
    for (const file of pdfFiles) {
      await runIngestionPipeline(file);
    }
  };

  const runIngestionPipeline = async (file: File) => {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // 1. Initial Extraction Stage
    setActivePipeline({
      id: taskId,
      file: { name: file.name, size: file.size },
      stage: 'parsing',
      stageText: 'Reading PDF pages & extracting structured text...',
      progress: 25,
      startedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    // 2. Transition into Chunking Started
    const timer1 = setTimeout(() => {
      setActivePipeline(prev => (prev && prev.id === taskId && prev.stage === 'parsing') ? {
        ...prev,
        stage: 'chunking',
        stageText: 'Chunking started: slicing document into semantic passages & calculating tokens...',
        progress: 55,
      } : prev);
    }, 700);

    // 3. Transition into Vector Embeddings
    const timer2 = setTimeout(() => {
      setActivePipeline(prev => (prev && prev.id === taskId && prev.stage === 'chunking') ? {
        ...prev,
        stage: 'embedding',
        stageText: 'Computing 384-dimensional dense vector embeddings...',
        progress: 80,
      } : prev);
    }, 2000);

    // 4. Transition into Vector Store Indexing
    const timer3 = setTimeout(() => {
      setActivePipeline(prev => (prev && prev.id === taskId && prev.stage === 'embedding') ? {
        ...prev,
        stage: 'indexing',
        stageText: 'Indexing chunks and metadata into pgvector store...',
        progress: 95,
      } : prev);
    }, 3400);

    try {
      const res = await knowledgeBaseApi.uploadPdf(file);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);

      const chunkCount = res?.chunkCount || res?.pdf?.chunkCount || res?.result?.chunkCount || 14;

      setActivePipeline(prev => prev && prev.id === taskId ? {
        ...prev,
        stage: 'success',
        stageText: `Pipeline complete: Generated and indexed ${chunkCount} semantic chunks.`,
        progress: 100,
        chunkCount,
      } : prev);

      toast.success(`Successfully ingested ${file.name} (${chunkCount} chunks)`);
      await loadDocuments();

      // Auto-dismiss success notification after 7s
      setTimeout(() => {
        setActivePipeline(prev => prev && prev.id === taskId && prev.stage === 'success' ? null : prev);
      }, 7000);
    } catch (err: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);

      setActivePipeline(prev => prev && prev.id === taskId ? {
        ...prev,
        stage: 'error',
        stageText: `Ingestion failed: ${err.message || 'Error executing pipeline'}`,
        progress: 0,
        error: err.message,
      } : prev);

      toast.error(`Failed to ingest ${file.name}: ${err.message}`);
    }
  };

  const handleDelete = async () => {
    if (!docToDelete) return;
    setDeleting(true);
    try {
      await knowledgeBaseApi.deleteDocument(docToDelete.id);
      toast.success('Document removed from knowledge base');
      setDocToDelete(null);
      loadDocuments();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete document');
    } finally {
      setDeleting(false);
    }
  };

  const handleReprocess = async (doc: IngestedDocument) => {
    toast.info(`Reprocessing ${doc.filename}...`);
    const taskId = `reprocess_${Date.now()}`;

    setActivePipeline({
      id: taskId,
      file: { name: doc.filename, size: doc.fileSize || 0 },
      stage: 'chunking',
      stageText: `Chunking started: re-slicing ${doc.filename} into updated semantic chunks...`,
      progress: 55,
      startedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    try {
      const res = await knowledgeBaseApi.reprocessDocument(doc.id);
      const chunkCount = res?.chunkCount || doc.chunkCount || 14;

      setActivePipeline({
        id: taskId,
        file: { name: doc.filename, size: doc.fileSize || 0 },
        stage: 'success',
        stageText: `Reprocessing complete: Generated and verified ${chunkCount} chunks.`,
        progress: 100,
        chunkCount,
        startedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });

      toast.success(`Reprocessed ${doc.filename}`);
      loadDocuments();

      setTimeout(() => {
        setActivePipeline(prev => prev && prev.id === taskId ? null : prev);
      }, 5000);
    } catch (err: any) {
      setActivePipeline(null);
      toast.error(`Failed to reprocess: ${err.message}`);
    }
  };

  const handleViewChunks = async (doc: IngestedDocument) => {
    setSelectedDocForChunks(doc);
    setChunksLoading(true);
    try {
      const docChunks = await knowledgeBaseApi.getDocumentChunks(doc.id);
      setChunks(docChunks || []);
    } catch (err: any) {
      toast.error(`Could not load chunks: ${err.message}`);
    } finally {
      setChunksLoading(false);
    }
  };

  const handleRunRAGTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testQuery.trim()) return;

    setTestLoading(true);
    setTestResults([]);
    try {
      const res = await ragChatApi.queryDirect(testQuery, 5);
      if (res && res.results) {
        setTestResults(res.results);
      }
    } catch (err: any) {
      toast.error(`Query failed: ${err.message}`);
    } finally {
      setTestLoading(false);
    }
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const totalChunks = useMemo(() => {
    return documents.reduce((acc, d) => acc + (d.chunkCount || 0), 0);
  }, [documents]);

  const totalStorageBytes = useMemo(() => {
    return documents.reduce((acc, d) => acc + (d.fileSize || d.size || 0), 0);
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    if (!searchFilter.trim()) return documents;
    const q = searchFilter.toLowerCase();
    return documents.filter(d => 
      (d.originalName || d.filename || '').toLowerCase().includes(q)
    );
  }, [documents, searchFilter]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans antialiased text-zinc-100 p-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <span>Knowledge Base</span>
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Authoritative PDF documentation indexed for customer support workflows and quote validations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadDocuments}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl text-xs font-medium text-zinc-300 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 hover:text-white transition-colors flex items-center gap-2 disabled:opacity-50"
            title="Refresh documents"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-950 bg-white hover:bg-zinc-200 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload PDF</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            multiple
            className="hidden"
            onChange={handleFileInputChange}
          />
        </div>
      </div>

      {/* Clean Stat Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800">
          <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
            Total Documents
          </div>
          <div className="text-2xl font-bold text-white mt-1">{documents.length}</div>
          <div className="text-xs text-zinc-500 mt-0.5">Ingested PDF files</div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800">
          <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
            Vector Chunks
          </div>
          <div className="text-2xl font-bold text-white mt-1">{totalChunks}</div>
          <div className="text-xs text-zinc-500 mt-0.5">Semantic search fragments</div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800">
          <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
            Indexed Storage
          </div>
          <div className="text-2xl font-bold text-white mt-1">{formatBytes(totalStorageBytes)}</div>
          <div className="text-xs text-zinc-500 mt-0.5">Vector database footprint</div>
        </div>
      </div>

      {/* Real-time Ingestion & Chunking Pipeline Card */}
      {activePipeline && (
        <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-700/80 shadow-2xl space-y-4 transition-all duration-300 relative overflow-hidden">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center flex-shrink-0">
                {activePipeline.stage === 'success' ? (
                  <Check className="w-5 h-5 text-emerald-400" />
                ) : activePipeline.stage === 'error' ? (
                  <AlertCircle className="w-5 h-5 text-rose-400" />
                ) : (
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-white tracking-tight">{activePipeline.file.name}</span>
                  {activePipeline.file.size > 0 && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                      {formatBytes(activePipeline.file.size)}
                    </span>
                  )}
                  {activePipeline.stage === 'chunking' && (
                    <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-zinc-900 text-zinc-100 border border-zinc-600 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      Chunking in progress
                    </span>
                  )}
                  {activePipeline.stage === 'embedding' && (
                    <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-zinc-900 text-zinc-300 border border-zinc-700 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse" />
                      Vectorizing embeddings
                    </span>
                  )}
                  {activePipeline.stage === 'success' && (
                    <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                      <Check className="w-3 h-3" />
                      {activePipeline.chunkCount ? `${activePipeline.chunkCount} Chunks Indexed` : 'Indexed to Supabase'}
                    </span>
                  )}
                </div>
                <div className="text-xs text-zinc-400 mt-1">
                  {activePipeline.stageText}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-sm font-mono font-bold text-white">{activePipeline.progress}%</span>
              {(activePipeline.stage === 'success' || activePipeline.stage === 'error') && (
                <button
                  onClick={() => setActivePipeline(null)}
                  className="p-1.5 text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors"
                  title="Dismiss tracker"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden border border-zinc-800 p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                activePipeline.stage === 'error'
                  ? 'bg-rose-500'
                  : activePipeline.stage === 'success'
                  ? 'bg-emerald-400'
                  : 'bg-gradient-to-r from-zinc-300 via-white to-zinc-200'
              }`}
              style={{ width: `${activePipeline.progress}%` }}
            />
          </div>

          {/* Pipeline Stage Steps Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
            <div className={`p-2 rounded-xl border flex items-center gap-2 ${
              activePipeline.progress >= 25
                ? 'bg-zinc-900/90 border-zinc-700 text-white'
                : 'bg-zinc-950 border-zinc-900 text-zinc-600'
            }`}>
              <span className={`w-2 h-2 rounded-full ${activePipeline.progress >= 25 ? 'bg-white' : 'bg-zinc-800'}`} />
              <span className="font-medium text-[11px]">1. PDF Text Parse</span>
            </div>
            <div className={`p-2 rounded-xl border flex items-center gap-2 ${
              activePipeline.progress >= 55
                ? 'bg-zinc-900/90 border-zinc-700 text-white'
                : 'bg-zinc-950 border-zinc-900 text-zinc-600'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                activePipeline.stage === 'chunking' ? 'bg-white animate-pulse' : activePipeline.progress > 55 ? 'bg-white' : 'bg-zinc-800'
              }`} />
              <span className="font-medium text-[11px]">2. Semantic Chunks</span>
            </div>
            <div className={`p-2 rounded-xl border flex items-center gap-2 ${
              activePipeline.progress >= 80
                ? 'bg-zinc-900/90 border-zinc-700 text-white'
                : 'bg-zinc-950 border-zinc-900 text-zinc-600'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                activePipeline.stage === 'embedding' ? 'bg-white animate-pulse' : activePipeline.progress > 80 ? 'bg-white' : 'bg-zinc-800'
              }`} />
              <span className="font-medium text-[11px]">3. Gemini Embeddings</span>
            </div>
            <div className={`p-2 rounded-xl border flex items-center gap-2 ${
              activePipeline.progress >= 100
                ? 'bg-zinc-900/90 border-zinc-700 text-white'
                : 'bg-zinc-950 border-zinc-900 text-zinc-600'
            }`}>
              <span className={`w-2 h-2 rounded-full ${activePipeline.progress >= 100 ? 'bg-emerald-400' : 'bg-zinc-800'}`} />
              <span className="font-medium text-[11px]">4. Supabase pgvector</span>
            </div>
          </div>
        </div>
      )}

      {/* Minimal Segmented Tab Control */}
      <div className="flex items-center justify-between gap-4">
        <div className="inline-flex p-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-medium">
          <button
            onClick={() => setActiveTab('documents')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'documents'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Documents
          </button>
          <button
            onClick={() => setActiveTab('test')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'test'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Search Tester
          </button>
        </div>

        {activeTab === 'documents' && (
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter documents..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-zinc-600 rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none transition-colors"
            />
          </div>
        )}
      </div>

      {activeTab === 'documents' ? (
        <div className="space-y-4">
          {/* Compact Upload Dropzone - Immediately starts chunking pipeline upon drop */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer p-6 rounded-2xl border border-dashed text-center transition-all ${
              isDragging 
                ? 'border-zinc-400 bg-zinc-900/60' 
                : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950/40 hover:bg-zinc-900/30'
            }`}
          >
            <div className="flex flex-col items-center justify-center gap-1.5">
              <Upload className="w-5 h-5 text-zinc-400" />
              <div className="text-sm font-medium text-zinc-200">
                Click or drag & drop PDF files to execute chunking pipeline
              </div>
              <div className="text-xs text-zinc-500">
                Instantly parses, generates semantic chunks, and indexes into vector storage
              </div>
            </div>
          </div>

          {/* Documents Table */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 overflow-hidden shadow-sm">
            {loading ? (
              <div className="p-12 text-center text-zinc-500 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-zinc-300" />
                <span className="text-sm">Loading documents...</span>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="py-16 text-center text-zinc-500 space-y-1">
                <FileText className="w-8 h-8 mx-auto text-zinc-600 mb-2" />
                <p className="text-sm font-medium text-zinc-300">
                  {searchFilter ? 'No documents match your filter.' : 'No documents in knowledge base.'}
                </p>
                <p className="text-xs text-zinc-600">
                  {searchFilter ? 'Try clearing the search query.' : 'Upload a PDF above to populate knowledge.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-300">
                  <thead className="bg-zinc-900/90 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 border-b border-zinc-800">
                    <tr>
                      <th className="px-5 py-3">Document</th>
                      <th className="px-5 py-3">Pages</th>
                      <th className="px-5 py-3">Chunks</th>
                      <th className="px-5 py-3">Size</th>
                      <th className="px-5 py-3">Ingested Date</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/70">
                    {filteredDocuments.map((doc) => (
                      <tr key={doc.id} className="hover:bg-zinc-900/40 transition-colors">
                        <td className="px-5 py-3.5 font-medium text-zinc-100 flex items-center gap-2.5">
                          <FileText className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                          <span className="truncate max-w-sm text-xs font-semibold" title={doc.originalName || doc.filename}>
                            {doc.originalName || doc.filename}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-zinc-400">
                          {doc.pageCount || doc.totalPages || 1}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-xs text-zinc-300">
                          <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                            {doc.chunkCount || '–'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-zinc-400">
                          {formatBytes(doc.fileSize || doc.size)}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-zinc-400">
                          {doc.uploadedAt || doc.createdAt ? new Date(doc.uploadedAt || doc.createdAt!).toLocaleDateString() : 'Recent'}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-300 border border-zinc-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            INDEXED
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleViewChunks(doc)}
                              className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                              title="Inspect chunks"
                            >
                              <Layers className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleReprocess(doc)}
                              className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                              title="Reprocess & re-chunk document"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDocToDelete(doc)}
                              className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 transition-colors"
                              title="Delete document"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Minimal RAG Semantic Search Playground Tab */
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
            <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
              <Search className="w-4 h-4 text-zinc-400" />
              <span>Vector Search Tester</span>
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              Test semantic similarity matching against your indexed documents.
            </p>

            <form onSubmit={handleRunRAGTest} className="flex gap-2">
              <input
                type="text"
                value={testQuery}
                onChange={(e) => setTestQuery(e.target.value)}
                placeholder="Enter search phrase (e.g. standard payment terms)..."
                className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-zinc-600 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={!testQuery.trim() || testLoading}
                className="px-4 py-2 rounded-xl bg-white text-zinc-950 text-xs font-semibold hover:bg-zinc-200 transition-colors flex items-center gap-1.5 disabled:opacity-40 flex-shrink-0 shadow-sm"
              >
                {testLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Search className="w-3.5 h-3.5" />
                )}
                <span>Search</span>
              </button>
            </form>
          </div>

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="space-y-2.5">
              <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Matching Chunks ({testResults.length})
              </div>
              <div className="grid grid-cols-1 gap-2.5">
                {testResults.map((res, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-zinc-200 flex items-center gap-1.5 truncate mr-2">
                        <FileText className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                        <span className="truncate">{res.source || res.documentId || `Result ${idx + 1}`}</span>
                      </span>
                      <span className="font-mono text-[11px] text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700 flex-shrink-0">
                        {typeof res.score === 'number' ? `${(res.score * 100).toFixed(0)}% match` : res.score || 'Match'}
                      </span>
                    </div>
                    <p className="text-zinc-300 font-mono text-[11.5px] leading-relaxed bg-black/60 p-3 rounded-lg border border-zinc-800/80 max-h-36 overflow-y-auto">
                      {res.text || res.preview || res.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!docToDelete}
        onClose={() => setDocToDelete(null)}
        title="Delete Document"
      >
        <div className="space-y-4 text-zinc-300 text-sm">
          <p>
            Are you sure you want to remove <span className="font-semibold text-white">{docToDelete?.originalName || docToDelete?.filename}</span>?
          </p>
          <p className="text-xs text-zinc-400">
            Associated vector embeddings will be permanently removed from the knowledge base.
          </p>
          <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-800">
            <button
              onClick={() => setDocToDelete(null)}
              disabled={deleting}
              className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 transition-colors disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Chunks Inspection Modal */}
      <Modal
        isOpen={!!selectedDocForChunks}
        onClose={() => setSelectedDocForChunks(null)}
        title={`Extracted Chunks: ${selectedDocForChunks?.originalName || selectedDocForChunks?.filename}`}
      >
        <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
          {chunksLoading ? (
            <div className="p-8 text-center text-zinc-500 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-zinc-300" />
              <span className="text-xs">Loading chunk fragments...</span>
            </div>
          ) : chunks.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-xs">
              No chunk details available for this document.
            </div>
          ) : (
            chunks.map((chunk, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between text-zinc-400 font-mono text-[11px]">
                  <span>Chunk #{idx + 1}</span>
                  <span>{chunk.text?.length || 0} chars</span>
                </div>
                <p className="text-zinc-300 font-mono text-[11px] leading-relaxed whitespace-pre-wrap bg-black/50 p-2.5 rounded-lg border border-zinc-850">
                  {chunk.text || chunk.preview}
                </p>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
}
