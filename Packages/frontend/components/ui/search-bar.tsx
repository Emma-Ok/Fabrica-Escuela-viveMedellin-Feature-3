import { Search } from "lucide-react"

interface SearchBarProps {
  readonly placeholder: string
}

export default function SearchBar({ placeholder }: Readonly<SearchBarProps>) {
  return (
    <div className="relative">
      <input
        type="text"
        placeholder={placeholder}
        className="w-[300px] md:w-[300px] sm:w-[200px] xs:w-[150px] pl-10 pr-4 py-2 rounded-md border border-[#e2e8f0] focus:outline-none"
      />
      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
        <Search className="w-4 h-4 text-gray-400" />
      </div>
    </div>
  )
}
