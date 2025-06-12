'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';

export function FollowUpParticipantsStep({
  users,
  setUsers,
  allUsers,
  onNext,
  onBack,
}: {
  users: string[];
  setUsers: React.Dispatch<React.SetStateAction<string[]>>;
  allUsers: { id: string; email: string; name?: string }[];
  onNext: (e: React.FormEvent<HTMLFormElement>) => void;
  onBack: () => void;
}) {
  const [open, setOpen] = useState(false);

  const toggleUser = (id: string) => {
    setUsers(currentUsers =>
      currentUsers.includes(id)
        ? currentUsers.filter(uid => uid !== id)
        : [...currentUsers, id]
    );
  };

  const selectedUsers = useMemo(() => {
    return allUsers.filter(u => users.includes(u.id));
  }, [users, allUsers]);

  return (
    <form className="space-y-6" onSubmit={onNext}>
      <div className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Assign Users</label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
              >
                {users.length > 0
                  ? `${users.length} user${users.length > 1 ? 's' : ''} selected`
                  : 'Select users...'}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
              <Command>
                <CommandInput placeholder="Search user by name or email..." />
                <CommandList>
                  <CommandEmpty>No user found.</CommandEmpty>
                  <CommandGroup>
                    {allUsers.map(user => (
                      <CommandItem
                        key={user.id}
                        value={`${user.email} ${user.name}`}
                        onSelect={() => {
                          toggleUser(user.id);
                        }}
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${
                            users.includes(user.id) ? 'opacity-100' : 'opacity-0'
                          }`}
                        />
                        <div className="flex flex-col">
                            <span className="font-medium">{user.name || user.email}</span>
                            {user.name && <span className="text-xs text-muted-foreground">{user.email}</span>}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
           <label className="block text-sm font-medium">Selected Participants</label>
           <div className="p-3 border rounded-md min-h-[80px] bg-muted/50">
             {selectedUsers.length > 0 ? (
               <div className="flex flex-wrap gap-2">
                 {selectedUsers.map(user => (
                   <Badge key={user.id} variant="secondary" className="flex items-center gap-1">
                     {user.name || user.email}
                     <button
                       type="button"
                       onClick={() => toggleUser(user.id)}
                       className="rounded-full hover:bg-muted-foreground/20 p-0.5"
                     >
                       <X className="h-3 w-3" />
                     </button>
                   </Badge>
                 ))}
               </div>
             ) : (
               <p className="text-sm text-muted-foreground">No users selected yet.</p>
             )}
           </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>Back</Button>
        <Button type="submit">Next: Frequency</Button>
      </div>
    </form>
  );
} 