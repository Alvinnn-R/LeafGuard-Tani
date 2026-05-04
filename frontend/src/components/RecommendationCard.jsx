import React from 'react';
import {
  CheckCircle2,
  XCircle,
  Lightbulb,
  ListOrdered,
  PackageSearch,
} from 'lucide-react';

/**
 * RecommendationCard — Card rekomendasi penanganan terpadu (mode "both").
 * Menampilkan kesesuaian produk, alasan, dan langkah-langkah aksi.
 *
 * @param {Object} props
 * @param {Object} props.recommendation - RecommendationCard dari backend/mock
 */

export default function RecommendationCard({ recommendation }) {
  if (!recommendation) return null;

  const {
    product_suitable,
    suitability_reason,
    recommended_product_type,
    action_steps,
  } = recommendation;

  return (
    <div className="animate-slide-up">
      <div className={`card border-l-4 overflow-hidden ${
        product_suitable ? 'border-l-green-500' : 'border-l-red-500'
      }`}>

        {/* Header: Suitability badge */}
        <div className="flex items-start gap-3 mb-4">
          <div className={`
            w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
            ${product_suitable ? 'bg-green-100' : 'bg-red-50'}
          `}>
            {product_suitable
              ? <CheckCircle2 size={22} className="text-green-600" />
              : <XCircle size={22} className="text-red-500" />
            }
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-0.5">
              Rekomendasi Terpadu
            </p>
            <h2 className="text-base font-bold leading-tight">
              <span className={product_suitable ? 'text-green-700' : 'text-red-600'}>
                {product_suitable ? 'Produk Sesuai' : 'Produk Tidak Sesuai'}
              </span>
            </h2>
          </div>
        </div>

        {/* Suitability reason */}
        <div className={`
          rounded-xl px-3.5 py-3 mb-4
          ${product_suitable ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}
        `}>
          <div className="flex items-start gap-2.5">
            <Lightbulb size={16} className={`mt-0.5 flex-shrink-0 ${
              product_suitable ? 'text-green-600' : 'text-red-500'
            }`} />
            <p className={`text-sm leading-relaxed ${
              product_suitable ? 'text-green-700' : 'text-red-700'
            }`}>
              {suitability_reason}
            </p>
          </div>
        </div>

        {/* Recommended product type — hanya jika TIDAK sesuai */}
        {!product_suitable && recommended_product_type && (
          <div className="flex items-start gap-2.5 p-3 bg-blue-50 border border-blue-100 rounded-xl mb-4">
            <PackageSearch size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-blue-500 uppercase tracking-wider mb-0.5">
                Produk yang Disarankan
              </p>
              <p className="text-sm text-blue-700 font-semibold">
                {recommended_product_type}
              </p>
            </div>
          </div>
        )}

        {/* Divider */}
        <hr className="border-gray-100 -mx-4 mb-4" />

        {/* Action Steps — numbered list */}
        {action_steps && action_steps.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ListOrdered size={16} className="text-primary flex-shrink-0" />
              <h3 className="text-sm font-semibold text-gray-700">
                Langkah Penanganan (24 Jam ke Depan)
              </h3>
            </div>

            <ol className="space-y-3">
              {action_steps.map((step, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  {/* Step number */}
                  <span className={`
                    w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0
                    text-xs font-bold mt-0.5
                    ${product_suitable
                      ? 'bg-primary text-white'
                      : idx === 0
                        ? 'bg-red-500 text-white'
                        : 'bg-primary text-white'
                    }
                  `}>
                    {idx + 1}
                  </span>

                  {/* Step text */}
                  <p className={`text-sm leading-relaxed ${
                    !product_suitable && idx === 0
                      ? 'text-red-700 font-medium'
                      : 'text-gray-600'
                  }`}>
                    {step}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
