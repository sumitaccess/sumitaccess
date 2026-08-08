import {
  Code2, Palette, Briefcase, Languages, Music, Dumbbell, Camera, Map, LineChart,
  Megaphone, Coffee, Terminal, Atom, Braces, Database, BarChart3, BrainCircuit, Globe,
  Frame, LayoutGrid, SearchCheck, Clapperboard, Image, TrendingUp, Rocket, Mic, Target,
  MessageSquareText, BookOpen, Guitar, Piano, MicVocal, Flower2, Footprints, Smartphone,
  Globe2, Satellite, MapPinned, Wallet, Table2, Search, Share2, PenLine, ChefHat, Sparkles,
  Trophy, type LucideIcon,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  Code2, Palette, Briefcase, Languages, Music, Dumbbell, Camera, Map, LineChart,
  Megaphone, Coffee, Terminal, Atom, Braces, Database, BarChart3, BrainCircuit, Globe,
  Frame, LayoutGrid, SearchCheck, Clapperboard, Image, TrendingUp, Rocket, Mic, Target,
  MessageSquareText, BookOpen, Guitar, Piano, MicVocal, Flower2, Footprints, Smartphone,
  Globe2, Satellite, MapPinned, Wallet, Table2, Search, Share2, PenLine, ChefHat, Sparkles,
  Trophy,
};

export function iconFor(name: string | null | undefined): LucideIcon {
  return (name && MAP[name]) || Code2;
}
