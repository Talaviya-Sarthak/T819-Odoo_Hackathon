import { useState, useEffect } from 'react';
import { getRecommendations, addRecommendation, dismissRecommendation } from '../../services/recommendations.api';
import { getQuotations } from '../../services/quotations.api';
import type { Quotation, Recommendation } from '../../types';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Select from '../../components/Select';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../components/Toast';

export default function AIAdvisor() {
  const { toast } = useToast();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [selectedQuotation, setSelectedQuotation] = useState('');
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingQuotations, setFetchingQuotations] = useState(true);

  useEffect(() => {
    getQuotations()
      .then((res) => {
        const list = Array.isArray(res) ? res : res?.quotations || [];
        setQuotations(list);
      })
      .catch(() => toast('Failed to load quotations', 'error'))
      .finally(() => setFetchingQuotations(false));
  }, []);

  const loadRecommendations = async (quotationId: string) => {
    setSelectedQuotation(quotationId);
    if (!quotationId) {
      setRecommendations([]);
      return;
    }
    setLoading(true);
    try {
      const res = await getRecommendations(quotationId);
      const recs = Array.isArray(res) ? res : res?.recommendations || [];
      setRecommendations(recs);
    } catch {
      toast('Failed to load recommendations', 'error');
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (rec: Recommendation) => {
    try {
      await addRecommendation(rec.id);
      toast('Recommendation added to quotation', 'success');
      setRecommendations((prev) => prev.filter((r) => r.id !== rec.id));
    } catch {
      toast('Failed to add recommendation', 'error');
    }
  };

  const handleDismiss = async (rec: Recommendation) => {
    try {
      await dismissRecommendation(rec.id);
      toast('Recommendation dismissed', 'info');
      setRecommendations((prev) => prev.filter((r) => r.id !== rec.id));
    } catch {
      toast('Failed to dismiss recommendation', 'error');
    }
  };

  const quotationOptions = (quotations || []).map((q) => {
    const qNum = (q as any).quotationNumber || q.quotation_number || (q.id ? q.id.slice(0, 8) : 'Quote');
    const cName = (q as any).customer?.name || (q as any).customer?.company || q.customer_name || 'Customer';
    return {
      value: q.id,
      label: `${qNum} - ${cName}`,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Deal Advisor</h1>
        <p className="text-sm text-gray-500">AI-powered product recommendations to maximize deal value</p>
      </div>

      <Card>
        <Select
          label="Select Quotation"
          value={selectedQuotation}
          onChange={(e) => loadRecommendations(e.target.value)}
          options={quotationOptions}
          placeholder="Choose a quotation to get recommendations"
          disabled={fetchingQuotations}
        />
      </Card>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-gray-500">Analyzing deal and generating recommendations...</p>
        </div>
      )}

      {!loading && selectedQuotation && recommendations.length === 0 && (
        <EmptyState
          title="No recommendations available"
          description="AI is analyzing this deal. Check back shortly or try a different quotation."
        />
      )}

      {!loading && !selectedQuotation && (
        <EmptyState
          title="Select a quotation"
          description="Choose a quotation above to see AI-powered product recommendations."
        />
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {recommendations.map((rec) => (
          <Card key={rec.id}>
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <h3 className="text-sm font-medium text-gray-900">{rec.product_name || rec.product_id}</h3>
                <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                  {Math.round(rec.confidence * 100)}% match
                </span>
              </div>
              <p className="text-sm text-gray-500">{rec.reason}</p>
              {rec.is_accepted && (
                <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                  Added to quotation
                </span>
              )}
              {rec.is_dismissed && (
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                  Dismissed
                </span>
              )}
              {!rec.is_accepted && !rec.is_dismissed && (
                <div className="flex gap-2 pt-2">
                  <Button onClick={() => handleAdd(rec)} className="flex-1">Add to Quote</Button>
                  <Button variant="secondary" onClick={() => handleDismiss(rec)} className="flex-1">Dismiss</Button>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
