"use client";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { user } = useAuth();
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="flex flex-col items-center justify-center text-center">
        <h1 className="text-6xl font-grimpt-brush text-white mb-4">Taste the Extraordinary</h1>
        <p className="text-xl font-garet text-gray-300 mb-8">
          From our kitchen to your table, every dish is a masterpiece.
        </p>
        <Image
          src="/logo.svg"
          alt="Logo"
          width={450}
          height={450}
          className="mb-6 rounded-full "
        />
       
        <div className="flex gap-4">
         
          <Link
            href={user ? "/menu" : "/login"}
            className="inline-block rounded bg-transparent border-2 border-white px-8 py-4 text-white font-grimpt text-2xl font-bold shadow-lg transition-transform hover:scale-105 hover:bg-white hover:text-[#eb3e04]"
          >
            Pre-Order Now
          </Link>
        </div>
      </div>
    </main>
  );
}
