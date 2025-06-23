import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowDown, Instagram, MessageCircle } from "lucide-react";
import { useStoreSettings } from "@/hooks/useStoreSettings";

const HeroBanner = () => {
  const { settings, updateStoreSettings } = useStoreSettings();
  const [editingName, setEditingName] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [editingSubtitle, setEditingSubtitle] = useState(false);
  const [editingInstagram, setEditingInstagram] = useState(false);
  const [editingWhats, setEditingWhats] = useState(false);
  const [name, setName] = useState(settings.store_name);
  const [desc, setDesc] = useState(settings.store_description);
  const [subtitle, setSubtitle] = useState(settings.store_subtitle);
  const [instagram, setInstagram] = useState(settings.instagram_url);
  const [whats, setWhats] = useState(settings.whatsapp_number);

  useEffect(() => {
    setName(settings.store_name);
    setDesc(settings.store_description);
    setSubtitle(settings.store_subtitle);
    setInstagram(settings.instagram_url);
    setWhats(settings.whatsapp_number);
  }, [settings.store_name, settings.store_description, settings.store_subtitle, settings.instagram_url, settings.whatsapp_number]);

  const handleWhatsAppClick = () => {
    if (!editingWhats) {
      window.open(`https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent('Olá! Gostaria de saber mais sobre os produtos da loja.')}`, '_blank');
    }
  };

  const handleInstagramClick = () => {
    if (!editingInstagram) {
      window.open(settings.instagram_url, '_blank');
    }
  };

  const saveName = async () => {
    if (name.trim() && name !== settings.store_name) {
      await updateStoreSettings({ store_name: name });
    }
    setEditingName(false);
  };

  const saveDesc = async () => {
    if (desc.trim() && desc !== settings.store_description) {
      await updateStoreSettings({ store_description: desc });
    }
    setEditingDesc(false);
  };

  const saveSubtitle = async () => {
    if (subtitle.trim() && subtitle !== settings.store_subtitle) {
      await updateStoreSettings({ store_subtitle: subtitle });
    }
    setEditingSubtitle(false);
  };

  const saveInstagram = async () => {
    if (instagram.trim() && instagram !== settings.instagram_url) {
      await updateStoreSettings({ instagram_url: instagram });
    }
    setEditingInstagram(false);
  };

  const saveWhats = async () => {
    if (whats.trim() && whats !== settings.whatsapp_number) {
      await updateStoreSettings({ whatsapp_number: whats });
    }
    setEditingWhats(false);
  };

  return (
    <section className="relative bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800 text-white overflow-hidden">
      {/* Background image */}
      {settings.desktop_banner && (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat" 
          style={{
            backgroundImage: `url('${settings.desktop_banner}')`
          }} 
        />
      )}
      
      {/* Subtle overlay for better text readability */}
      <div className="absolute inset-0 bg-black/30"></div>
      
      <div className="relative max-w-6xl mx-auto px-4 py-20">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in drop-shadow-lg">
            {editingName ? (
              <input
                className="text-4xl md:text-6xl font-bold text-center bg-transparent border-b border-white outline-none w-full mb-2"
                value={name}
                autoFocus
                onChange={e => setName(e.target.value)}
                onBlur={saveName}
                onKeyDown={e => { if (e.key === 'Enter') saveName(); }}
                maxLength={50}
              />
            ) : (
              <span onClick={() => setEditingName(true)} className="cursor-pointer hover:underline">
                {settings.store_name}
              </span>
            )}
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-200 mt-2">
              {editingSubtitle ? (
                <input
                  className="text-2xl md:text-4xl font-bold text-center bg-transparent border-b border-white outline-none w-full"
                  value={subtitle}
                  autoFocus
                  onChange={e => setSubtitle(e.target.value)}
                  onBlur={saveSubtitle}
                  onKeyDown={e => { if (e.key === 'Enter') saveSubtitle(); }}
                  maxLength={60}
                />
              ) : (
                <span onClick={() => setEditingSubtitle(true)} className="cursor-pointer hover:underline">
                  {settings.store_subtitle}
                </span>
              )}
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-2xl mx-auto whitespace-pre-line drop-shadow-md">
            {editingDesc ? (
              <textarea
                className="w-full bg-transparent border-b border-white outline-none text-xl md:text-2xl text-center resize-none"
                value={desc}
                autoFocus
                rows={2}
                onChange={e => setDesc(e.target.value)}
                onBlur={saveDesc}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveDesc(); } }}
                maxLength={200}
              />
            ) : (
              <span onClick={() => setEditingDesc(true)} className="cursor-pointer hover:underline">
                {settings.store_description}
              </span>
            )}
          </p>
          
          <div className="flex justify-center items-center gap-6">
            <div className="relative">
              <button
                onClick={editingInstagram ? undefined : handleInstagramClick}
                className={`bg-white text-black p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 hover:bg-gray-100 ${editingInstagram ? 'ring-2 ring-yellow-400' : ''}`}
                aria-label="Seguir no Instagram"
                type="button"
              >
                <Instagram className="h-6 w-6" />
              </button>
              <span
                className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs cursor-pointer hover:underline"
                onClick={() => setEditingInstagram(true)}
              >
                {editingInstagram ? (
                  <input
                    className="bg-white text-black rounded px-2 py-1 w-44 text-xs"
                    value={instagram}
                    autoFocus
                    onChange={e => setInstagram(e.target.value)}
                    onBlur={saveInstagram}
                    onKeyDown={e => { if (e.key === 'Enter') saveInstagram(); }}
                  />
                ) : (
                  settings.instagram_url.replace(/^https?:\/\//, '')
                )}
              </span>
            </div>
            <div className="relative">
              <button
                onClick={editingWhats ? undefined : handleWhatsAppClick}
                className={`bg-black text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 hover:bg-gray-800 ${editingWhats ? 'ring-2 ring-green-400' : ''}`}
                aria-label="Contato via WhatsApp"
                type="button"
              >
                <MessageCircle className="h-6 w-6" />
              </button>
              <span
                className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs cursor-pointer hover:underline"
                onClick={() => setEditingWhats(true)}
              >
                {editingWhats ? (
                  <input
                    className="bg-white text-black rounded px-2 py-1 w-36 text-xs"
                    value={whats}
                    autoFocus
                    onChange={e => setWhats(e.target.value)}
                    onBlur={saveWhats}
                    onKeyDown={e => { if (e.key === 'Enter') saveWhats(); }}
                  />
                ) : (
                  settings.whatsapp_number
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
