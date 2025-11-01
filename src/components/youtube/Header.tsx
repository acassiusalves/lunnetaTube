'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, PlayCircle, Search, Bell, User } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/buscador-youtube?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#f0f0f0] flex items-center justify-between px-4 h-14 shadow-sm">
      {/* Left Section - Logo and Menu */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 hover:bg-[#FFE9D6] rounded-full transition-colors"
          aria-label="Menu"
        >
          <Menu className="w-6 h-6 text-[#0f0f0f]" />
        </button>

        <a href="/buscador-youtube" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <PlayCircle className="w-8 h-8 text-[#FF6B00]" fill="#FF6B00" />
          <span className="text-xl font-medium text-[#0f0f0f] hidden sm:inline">
            Analisador de Mercado
          </span>
        </a>
      </div>

      {/* Center Section - Search */}
      <div className="flex-1 max-w-2xl mx-4 hidden md:block">
        <form onSubmit={handleSearch} className="flex items-center">
          <div className="flex-1 flex items-center border border-[#f0f0f0] rounded-l-full overflow-hidden focus-within:border-[#FF6B00] focus-within:shadow-md transition-all">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar"
              className="flex-1 px-4 py-2 text-base outline-none bg-white text-[#0f0f0f] placeholder-gray-500"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-[#FFE9D6] border border-l-0 border-[#f0f0f0] rounded-r-full hover:bg-[#FFD9B8] transition-colors"
            aria-label="Pesquisar"
          >
            <Search className="w-5 h-5 text-[#FF6B00]" />
          </button>
        </form>
      </div>

      {/* Right Section - Icons */}
      <div className="flex items-center gap-2">
        <button
          className="p-2 hover:bg-[#FFE9D6] rounded-full transition-colors hidden sm:block"
          aria-label="Notificações"
        >
          <Bell className="w-6 h-6 text-[#0f0f0f]" />
        </button>

        <button
          className="p-2 hover:bg-[#FFE9D6] rounded-full transition-colors"
          aria-label="Conta"
        >
          <User className="w-6 h-6 text-[#0f0f0f]" />
        </button>
      </div>
    </header>
  );
}
