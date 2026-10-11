import { useState } from "react";
import { Field } from "../../ui/field";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { Search } from "lucide-react";

export interface SearchBarProps {
  readonly value?: string;
  readonly onValueChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  readonly onSubmit?: (e: React.SubmitEvent<HTMLFormElement>) => void;
  readonly placeholder?: string;
  readonly className?: string;
}

export default function SearchBar({
  value,
  onValueChange,
  onSubmit,
  placeholder = "Search books by title, author, or genre...",
  className,
}: SearchBarProps) {
  const [internalQuery, setInternalQuery] = useState("");

  const isControlled = value !== undefined;
  const currentQuery = isControlled ? value : internalQuery;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onValueChange) {
      onValueChange(e);
    }
    if (!isControlled) {
      setInternalQuery(e.target.value);
    }
  };

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`${className ?? ""}`.trim()}>
      <Field orientation="horizontal">
        <Input
          type="text"
          value={currentQuery}
          onChange={handleChange}
          placeholder={placeholder}
          className="h-15 rounded-full border-2 placeholder:italic px-4"
        />
        <Button type="submit" className="h-15 w-30 rounded-full text-[1rem]">
          <Search className="size-5" />
          Search
        </Button>
      </Field>
    </form>
  );
}
