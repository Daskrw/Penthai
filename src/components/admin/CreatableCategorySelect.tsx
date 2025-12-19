import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Category {
  id: string;
  name: string;
}

interface CreatableCategorySelectProps {
  value: string;
  onChange: (value: string) => void;
}

const CreatableCategorySelect = ({ value, onChange }: CreatableCategorySelectProps) => {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const handleCreateCategory = async (name: string) => {
    if (!name.trim()) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("categories")
        .insert({ name: name.trim() })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Category exists",
            description: "This category already exists.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else {
        setCategories([...categories, data]);
        onChange(data.name);
        toast({
          title: "Category created",
          description: `"${data.name}" has been added.`,
        });
      }
    } catch (error) {
      console.error("Error creating category:", error);
      toast({
        title: "Error",
        description: "Failed to create category.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setOpen(false);
      setInputValue("");
    }
  };

  const categoryExists = categories.some(
    (cat) => cat.name.toLowerCase() === inputValue.toLowerCase()
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-background"
        >
          {value || "Select category..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 bg-popover z-50" align="start">
        <Command>
          <CommandInput
            placeholder="Search or create category..."
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            <CommandEmpty>
              {inputValue.trim() && !categoryExists && (
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => handleCreateCategory(inputValue)}
                  disabled={loading}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create "{inputValue}"
                </Button>
              )}
              {!inputValue.trim() && "No categories found."}
            </CommandEmpty>
            <CommandGroup>
              {categories.map((category) => (
                <CommandItem
                  key={category.id}
                  value={category.name}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                    setInputValue("");
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === category.name ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {category.name}
                </CommandItem>
              ))}
              {inputValue.trim() && !categoryExists && (
                <CommandItem
                  value={`create-${inputValue}`}
                  onSelect={() => handleCreateCategory(inputValue)}
                  className="text-primary"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create "{inputValue}"
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default CreatableCategorySelect;
