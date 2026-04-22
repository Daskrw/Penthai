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

interface Subcategory {
  id: string;
  name: string;
}

interface Props {
  value: string | null;
  onChange: (id: string | null, name: string | null) => void;
}

const CreatableSubcategorySelect = ({ value, onChange }: Props) => {
  const [open, setOpen] = useState(false);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const { data } = await supabase.from("subcategories").select("id, name").order("name");
    setSubcategories(data || []);
  };

  const create = async (name: string) => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("subcategories")
        .insert({ name: name.trim() })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          toast({ title: "หมวดย่อยมีอยู่แล้ว", variant: "destructive" });
        } else throw error;
      } else if (data) {
        setSubcategories([...subcategories, data]);
        onChange(data.id, data.name);
        toast({ title: "สร้างหมวดย่อยสำเร็จ", description: `"${data.name}"` });
      }
    } catch (e) {
      toast({ title: "Error", description: "ไม่สามารถสร้างหมวดย่อยได้", variant: "destructive" });
    } finally {
      setLoading(false);
      setOpen(false);
      setInputValue("");
    }
  };

  const exists = subcategories.some((s) => s.name.toLowerCase() === inputValue.toLowerCase());
  const selected = subcategories.find((s) => s.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className="w-full justify-between bg-background">
          {selected?.name || "เลือกหมวดย่อย..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 bg-popover z-50" align="start">
        <Command>
          <CommandInput
            placeholder="ค้นหาหรือสร้างหมวดย่อย..."
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            <CommandEmpty>
              {inputValue.trim() && !exists && (
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => create(inputValue)}
                  disabled={loading}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  สร้าง "{inputValue}"
                </Button>
              )}
              {!inputValue.trim() && "ไม่พบหมวดย่อย"}
            </CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="__none__"
                onSelect={() => {
                  onChange(null, null);
                  setOpen(false);
                }}
              >
                <Check className={cn("mr-2 h-4 w-4", !value ? "opacity-100" : "opacity-0")} />
                ไม่ระบุ
              </CommandItem>
              {subcategories.map((s) => (
                <CommandItem
                  key={s.id}
                  value={s.name}
                  onSelect={() => {
                    onChange(s.id, s.name);
                    setOpen(false);
                    setInputValue("");
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === s.id ? "opacity-100" : "opacity-0")} />
                  {s.name}
                </CommandItem>
              ))}
              {inputValue.trim() && !exists && (
                <CommandItem
                  value={`create-${inputValue}`}
                  onSelect={() => create(inputValue)}
                  className="text-primary"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  สร้าง "{inputValue}"
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default CreatableSubcategorySelect;
