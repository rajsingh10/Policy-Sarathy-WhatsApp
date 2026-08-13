import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, Folder, X } from "lucide-react";

interface Contact {
  id: string;
  name: string;
  phone: string;
  tags: string[];
  groupIds: string[];
}

interface Group {
  id: string;
  name: string;
  members: Array<{
    id: string;
    name: string;
    phone: string;
  }>;
}

interface ContactSelectionCardProps {
  contacts: Contact[];
  groups: Group[];
  selectedContacts: string[];
  onSelectContact: (contactId: string) => void;
  onSelectAll: () => void;
  onSelectContacts: (contactIds: string[]) => void;
  onSearch: (term: string) => void;
  onFilterGroups: (groupIds: string[]) => void;
  searchTerm: string;
  filterGroups: string[];
  itemsPerPage?: number;
  pagination?: any;
  onPageChange?: (page: number) => void;
}

export const ContactSelectionCard: React.FC<ContactSelectionCardProps> = ({
  contacts,
  groups,
  selectedContacts,
  onSelectContact,
  onSelectAll,
  onSelectContacts,
  onSearch,
  onFilterGroups,
  searchTerm,
  filterGroups,
  itemsPerPage = 50, // default per page
  pagination,
  onPageChange,
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Create a map of contact to groups for display
  const contactGroupsMap = useMemo(() => {
    const map = new Map<string, Group[]>();
    contacts.forEach((contact) => {
      const contactGroups = groups.filter((group) =>
        group.members?.some((member) => member.id === contact.id)
      );
      map.set(contact.id, contactGroups);
    });
    return map;
  }, [contacts, groups]);

  // Filter contacts based on search term and groups
  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      const matchesSearch =
        searchTerm === "" ||
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.phone.includes(searchTerm);

      // If no groups selected, show all contacts
      if (filterGroups.length === 0) {
        return matchesSearch;
      }

      // Check if contact is in any of the selected groups
      const matchesGroups = filterGroups.some((groupId) =>
        groups
          .find((g) => g.id === groupId)
          ?.members?.some((member) => member.id === contact.id)
      );

      return matchesSearch && matchesGroups;
    });
  }, [searchTerm, filterGroups, contacts, groups]);

  // Pagination
  const paginatedContacts = useMemo(() => {
    if (pagination) return filteredContacts;
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredContacts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredContacts, currentPage, itemsPerPage, pagination]);

  const totalPages = pagination ? pagination.last_page : Math.ceil(filteredContacts.length / itemsPerPage);

  const handleNext = () => {
    if (pagination && onPageChange) {
      if (pagination.current_page < pagination.last_page) {
        onPageChange(pagination.current_page + 1);
      }
    } else {
      if (currentPage < totalPages) {
        setCurrentPage((prev) => prev + 1);
      }
    }
  };

  const handlePrev = () => {
    if (pagination && onPageChange) {
      if (pagination.current_page > 1) {
        onPageChange(pagination.current_page - 1);
      }
    } else {
      if (currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      }
    }
  };

  // Get group name from group ID
  const getGroupName = (groupId: string) => {
    const group = groups.find((g) => g.id === groupId);
    return group ? group.name : "Unknown Group";
  };

  // Get group members
  const getGroupMembers = (groupId: string) => {
    const group = groups.find((g) => g.id === groupId);
    return group ? group.members || [] : [];
  };

  return (
    <Card className="card-elegant">
      <CardHeader className="px-2 sm:px-6 pt-2 pb-1 sm:pt-4 sm:pb-2">
        <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
          <span className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>
              Select Contacts ({selectedContacts.length}/
              {pagination && pagination.total ? pagination.total : filteredContacts.length})
            </span>
          </span>
          {filterGroups.length === 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSelectAll}
              className="w-full sm:w-auto"
            >
              {selectedContacts.length > 0 && selectedContacts.length >= (pagination && pagination.total ? pagination.total : filteredContacts.length) ? "Deselect All" : "Select All"}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 sm:px-6 space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row gap-3 sm:space-x-4">
          <div className="flex-1">
            <Input
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => {
                onSearch(e.target.value);
                if (pagination && onPageChange) {
                  onPageChange(1);
                } else {
                  setCurrentPage(1); // reset page on search
                }
              }}
              className="w-full"
            />
          </div>

          {/* Multi-select Groups Dropdown */}
          <div className="w-full sm:w-48">
            <Select
              value=""
              onValueChange={(groupId) => {
                if (groupId && !filterGroups.includes(groupId)) {
                  onFilterGroups([...filterGroups, groupId]);
                  if (pagination && onPageChange) {
                    onPageChange(1);
                  } else {
                    setCurrentPage(1);
                  }
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Groups">
                  <div className="flex items-center">
                    <Folder className="h-3.5 w-3.5 mr-1" />
                    {filterGroups.length > 0
                      ? `Add Groups (${filterGroups.length})`
                      : "Select Groups"}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {groups
                  .filter((group) => !filterGroups.includes(group.id))
                  .map((group) => (
                    <SelectItem
                      className="py-2 px-2"
                      key={group.id}
                      value={group.id}
                    >
                      <div className="flex items-center m-0 p-0">
                        <Folder className="h-3.5 w-3.5 mr-1" />
                        {group.name} ({group.members?.length || 0} members)
                      </div>
                    </SelectItem>
                  ))}
                {groups.filter((group) => !filterGroups.includes(group.id))
                  .length === 0 && (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    All groups selected
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {filterGroups.length > 0 && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Folder className="h-4 w-4 text-blue-500" />
                <span className="font-medium">
                  Selected Groups ({filterGroups.length})
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onFilterGroups([]);
                  onSelectContacts([]);
                }}
                className="text-xs"
              >
                Clear All
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {filterGroups.map((groupId) => (
                <Badge
                  key={groupId}
                  variant="secondary"
                  className="text-xs flex items-center gap-1 pr-1"
                >
                  <Folder className="h-3 w-3" />
                  {getGroupName(groupId)} ({getGroupMembers(groupId).length})
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-red-100"
                    onClick={() => {
                      const newFilterGroups = filterGroups.filter(
                        (id) => id !== groupId
                      );
                      onFilterGroups(newFilterGroups);

                      // Remove contacts from this group from selected contacts
                      const group = groups.find((g) => g.id === groupId);
                      if (group?.members) {
                        const contactsToRemove = group.members.map(
                          (member) => member.id
                        );
                        const updatedSelectedContacts = selectedContacts.filter(
                          (contactId) => !contactsToRemove.includes(contactId)
                        );
                        onSelectContacts(updatedSelectedContacts);
                      }

                      if (pagination && onPageChange) {
                        onPageChange(1);
                      } else {
                        setCurrentPage(1);
                      }
                    }}
                  >
                    <X className="h-3 w-3 text-red-500" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Paginated Contact List */}
        <div className="max-h-60 overflow-y-auto space-y-1">
          {paginatedContacts.length > 0 ? (
            paginatedContacts.map((contact) => {
              const contactGroups = contactGroupsMap.get(contact.id) || [];
              const visibleGroups = contactGroups.slice(0, 3);
              const hiddenGroups = contactGroups.slice(3);
              return (
                <div
                  key={contact.id}
                  className="flex items-center space-x-2 py-1.5 px-2 border rounded-lg hover:bg-muted/50"
                >
                  <Checkbox
                    checked={selectedContacts.includes(contact.id)}
                    onCheckedChange={() => onSelectContact(contact.id)}
                  />
                  <div className="flex-1 flex flex-row items-center gap-2 overflow-hidden">
                    <div className="font-medium text-sm truncate">{contact.name}</div>
                    <div className="w-px h-3 bg-gray-300 shrink-0"></div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                      {contact.phone}
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center flex-wrap gap-1 ">
                    {visibleGroups.map((group) => (
                      <Badge
                        key={group.id}
                        variant="outline"
                        className="text-xs bg-purple-50 text-purple-700 flex items-center gap-1"
                      >
                        <Folder className="w-3.5 h-3.5 text-purple-600" />
                        {group.name}
                      </Badge>
                    ))}

                    {hiddenGroups.length > 0 && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 px-1 text-[11px] text-blue-600 hover:underline"
                          >
                            +{hiddenGroups.length} more
                          </Button>
                        </PopoverTrigger>

                        <PopoverContent className="p-3 w-56">
                          <div className="space-y-2">
                            {hiddenGroups.map((group) => (
                              <div
                                key={group.id}
                                className="flex items-center gap-2 text-sm"
                              >
                                <Folder className="w-4 h-4 text-muted-foreground" />
                                <span>{group.name}</span>
                              </div>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              {filterGroups.length > 0
                ? `No contacts found in selected groups`
                : "No contacts found"}
            </div>
          )}
        </div>

        <div className="flex justify-between mt-2 items-center">
          <Button
            size="sm"
            variant="outline"
            onClick={handlePrev}
            disabled={(pagination ? pagination.current_page : currentPage) === 1}
          >
            Previous
          </Button>
          <span>
            Page {pagination ? pagination.current_page : currentPage} of {totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={handleNext}
            disabled={(pagination ? pagination.current_page : currentPage) === totalPages}
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
