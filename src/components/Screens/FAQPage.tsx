/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  HelpCircle, 
  MessageSquare, 
  ChevronDown, 
  ChevronUp, 
  Phone, 
  Check, 
  ExternalLink,
  RefreshCw,
  BookOpen
} from 'lucide-react';
import GlassCard from '../GlassCard';
import { useTranslation } from '../../hooks/useTranslation';
import { supabase } from '../../lib/supabase';

interface FAQItemData {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const CATEGORIES = [
  { id: 'ALL', labelId: 'Semua', labelEn: 'All' },
  { id: 'RFID', labelId: 'RFID & Scanner', labelEn: 'RFID & Scanner' },
  { id: 'PAYMENT', labelId: 'Pembayaran', labelEn: 'Payments' },
  { id: 'QUEUE', labelId: 'Antrian', labelEn: 'Queue' },
  { id: 'VEHICLE', labelId: 'Kendaraan', labelEn: 'Vehicles' },
  { id: 'STATION', labelId: 'Stasiun SPBU', labelEn: 'SPBU Stations' },
  { id: 'TROUBLESHOOTING', labelId: 'Panduan Kendala', labelEn: 'Troubleshooting' },
  { id: 'FLEET', labelId: 'Manajemen Fleet', labelEn: 'Fleet' }
];

export function FAQPage() {
  const { language } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [faqs, setFaqs] = useState<FAQItemData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  // Fetch initial FAQs and handle searches
  useEffect(() => {
    async function loadFaqs() {
      setIsLoading(true);
      try {
        if (searchQuery.trim().length > 2) {
          // Use search_faqs RPC for intelligent similarity search
          const { data, error } = await supabase.rpc('search_faqs', {
            query_text: searchQuery,
            min_similarity: 0.15 // lower similarity to return more results in general search
          });

          if (error) throw error;
          
          let filtered = data || [];
          if (selectedCategory !== 'ALL') {
            filtered = filtered.filter((f: any) => f.category === selectedCategory);
          }
          setFaqs(filtered);
        } else {
          // Default: Fetch directly from public.faqs table
          let query = supabase.from('faqs').select('id, question, answer, category');
          
          if (selectedCategory !== 'ALL') {
            query = query.eq('category', selectedCategory);
          }
          
          const { data, error } = await query.order('created_at', { ascending: true }).limit(50);
          if (error) throw error;
          setFaqs(data || []);
        }
      } catch (err) {
        console.error('Error loading FAQs from database:', err);
      } finally {
        setIsLoading(false);
      }
    }

    const delayDebounce = setTimeout(() => {
      loadFaqs();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, selectedCategory]);

  const toggleFaq = (id: string) => {
    setOpenFaqId(openFaqId === id ? null : id);
  };

  const handleWhatsappCS = () => {
    const text = encodeURIComponent(
      language === 'id' 
        ? "Halo CS SFRT, saya pelanggan SFRT Refuel dan membutuhkan bantuan terkait..."
        : "Hello CS SFRT, I am an SFRT Refuel customer and I need assistance with..."
    );
    window.open(`https://wa.me/6289522177567?text=${text}`, '_blank');
  };

  return (
    <div className="flex-grow space-y-8 text-text-primary font-sans" id="faq-page-module">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-border-primary/50 pb-5">
        <div className="space-y-1">
          <h1 className="font-sans font-extrabold text-2xl tracking-tight text-text-primary uppercase flex items-center gap-2">
            <HelpCircle className="w-7 h-7 text-brand-emerald" />
            {language === 'id' ? 'Tanya Jawab (FAQ)' : 'FAQ Support'}
          </h1>
          <p className="text-xs text-text-secondary">
            {language === 'id' 
              ? 'Temukan jawaban cepat untuk kendala operasional Anda atau hubungi Customer Service kami.' 
              : 'Find quick answers to your operational questions or contact our Customer Service.'}
          </p>
        </div>
        
        <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full text-emerald-600 text-[9px] font-bold uppercase tracking-wider select-none shrink-0">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          {language === 'id' ? '1.000+ Panduan Siap Saji' : '1,000+ Guides Ready'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Search, Filters & CS WhatsApp Card */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Search Box */}
          <GlassCard title={language === 'id' ? 'Pencarian FAQ' : 'FAQ Search'}>
            <div className="relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-text-secondary" />
              <input
                type="text"
                placeholder={language === 'id' ? 'Cari kendala, kendaraan, atau kota...' : 'Search issues, vehicles, or cities...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-overlay border border-border-primary rounded-xl py-2.5 pl-10 pr-4 text-xs font-sans font-semibold text-text-primary focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald/20 focus:outline-none transition-all shadow-[2px_2px_0px_rgba(0,0,0,0.15)] dark:shadow-none"
              />
            </div>
            
            {searchQuery && (
              <p className="text-[10px] text-text-secondary mt-2.5 text-left font-medium">
                {language === 'id' 
                  ? `Menampilkan hasil pencarian untuk "${searchQuery}"`
                  : `Showing search results for "${searchQuery}"`}
              </p>
            )}
          </GlassCard>

          {/* Categories Selector */}
          <GlassCard title={language === 'id' ? 'Kategori Panduan' : 'Guide Categories'}>
            <div className="flex flex-col gap-2 text-left">
              {CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between border cursor-pointer ${
                      isActive 
                        ? 'bg-brand-emerald/10 text-brand-emerald border-brand-emerald shadow-[2px_2px_0px_rgba(16,185,129,0.15)]' 
                        : 'bg-overlay/40 border-border-primary/50 text-text-secondary hover:border-brand-emerald/30 hover:text-text-primary'
                    }`}
                  >
                    <span>{language === 'id' ? cat.labelId : cat.labelEn}</span>
                    {isActive && <Check className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>
          </GlassCard>

          {/* WhatsApp / CS Support Card */}
          <div className="bg-overlay border-2 border-black dark:border-zinc-800 rounded-3xl p-5 text-left shadow-[5px_5px_0px_#000] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-emerald/5 rounded-bl-full pointer-events-none" />
            
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-brand-emerald/10 border border-brand-emerald/20 flex items-center justify-center text-brand-emerald">
                <MessageSquare className="w-5 h-5 animate-pulse" />
              </div>
              
              <div className="space-y-1">
                <h3 className="font-sans font-extrabold text-sm text-text-primary uppercase tracking-tight">
                  {language === 'id' ? 'Ada Kendala Operasional?' : 'Operational Issues?'}
                </h3>
                <p className="text-[11px] text-text-secondary leading-relaxed font-medium">
                  {language === 'id'
                    ? 'Jika Anda mengalami masalah scanner RFID di SPBU, transaksi ganda, atau butuh bantuan mendesak, hubungi CS WhatsApp kami.'
                    : 'If you experience scanner failure, double transaction charges, or need urgent help, reach out to our WhatsApp CS.'}
                </p>
              </div>

              <div className="bg-panel-bg/80 border border-border-primary/60 rounded-2xl p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest block leading-none">WhatsApp CS</span>
                  <span className="text-xs font-bold text-text-primary block mt-0.5">+62 895-2217-7567</span>
                </div>
              </div>

              <button
                onClick={handleWhatsappCS}
                className="w-full bg-brand-emerald hover:bg-brand-emerald-dim text-white border-2 border-black dark:border-zinc-800 hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[3px_3px_0px_#000] active:translate-y-0 active:translate-x-0 active:shadow-none shadow-[2px_2px_0px_#000] transition-all py-2.5 rounded-xl text-xs font-sans font-bold flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider"
              >
                <span>{language === 'id' ? 'Hubungi WhatsApp' : 'Contact WhatsApp'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

        {/* Right Side: List of FAQs */}
        <div className="lg:col-span-8 space-y-6">
          <GlassCard 
            title={language === 'id' ? 'Daftar Tanya Jawab Terdaftar' : 'Registered Knowledge Base'} 
            subtitle={
              language === 'id' 
                ? `Menampilkan ${faqs.length} panduan yang cocok` 
                : `Showing ${faqs.length} matching guides`
            }
          >
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-brand-emerald">
                <RefreshCw className="w-6 h-6 animate-spin" />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  {language === 'id' ? 'Menyelaraskan FAQ...' : 'Loading Knowledge...'}
                </span>
              </div>
            ) : faqs.length === 0 ? (
              <div className="text-center py-16 space-y-4 border border-dashed border-border-primary rounded-2xl p-6 bg-overlay/20">
                <BookOpen className="w-12 h-12 text-text-secondary/35 mx-auto" />
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm">
                    {language === 'id' ? 'FAQ Tidak Ditemukan' : 'No Matching FAQs'}
                  </h4>
                  <p className="text-xs text-text-secondary max-w-sm mx-auto leading-relaxed">
                    {language === 'id' 
                      ? 'Coba gunakan kata kunci pencarian yang berbeda atau pilih kategori panduan lainnya.' 
                      : 'Try using different keywords or selecting a different guide category.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5">
                {faqs.map((faq) => {
                  const isOpen = openFaqId === faq.id;
                  return (
                    <div 
                      key={faq.id}
                      className={`border rounded-2xl overflow-hidden transition-all text-left ${
                        isOpen 
                          ? 'border-brand-emerald bg-brand-emerald/5 shadow-[2px_2px_0px_rgba(16,185,129,0.1)]' 
                          : 'border-border-primary bg-panel-bg hover:border-brand-emerald/20'
                      }`}
                    >
                      <button
                        onClick={() => toggleFaq(faq.id)}
                        className="w-full px-5 py-4 flex items-center justify-between gap-4 font-sans font-bold text-xs sm:text-sm text-text-primary hover:text-brand-emerald transition-colors text-left focus:outline-none cursor-pointer"
                      >
                        <span className="pr-4">{faq.question}</span>
                        <div className="shrink-0 p-1 bg-overlay border border-border-primary/50 rounded-lg">
                          {isOpen ? <ChevronUp className="w-4 h-4 text-brand-emerald" /> : <ChevronDown className="w-4 h-4 text-text-secondary" />}
                        </div>
                      </button>
                      
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="px-5 pb-5 pt-1 border-t border-border-primary/30 text-xs sm:text-sm text-text-secondary leading-relaxed font-medium">
                              <p className="whitespace-pre-line">{faq.answer}</p>
                              
                              <div className="mt-4 pt-3 border-t border-border-primary/30 flex justify-between items-center text-[10px] uppercase font-bold text-text-secondary">
                                <span>Kategori: <strong className="text-brand-emerald">{faq.category}</strong></span>
                                <button 
                                  onClick={handleWhatsappCS}
                                  className="text-emerald-500 hover:text-emerald-600 flex items-center gap-1 font-bold cursor-pointer"
                                >
                                  {language === 'id' ? 'Bantu CS' : 'Get Help'}
                                  <ExternalLink className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </GlassCard>
        </div>

      </div>

    </div>
  );
}
