import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Phone, Plus, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface EmergencyContact {
  name: string;
  mobile: string;
}

export function EmergencyContacts() {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newContact, setNewContact] = useState<EmergencyContact>({
    name: '',
    mobile: '',
  });

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/customer/emergency-contacts', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch emergency contacts');
      }

      setContacts(data.contacts || []);
    } catch (error: any) {
      console.error('Fetch contacts error:', error);
      toast.error(error.message || 'Failed to fetch emergency contacts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddContact = async () => {
    if (!newContact.name.trim() || !newContact.mobile.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    // Validate mobile number (10 digits)
    if (!/^\d{10}$/.test(newContact.mobile)) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/customer/emergency-contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newContact),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add emergency contact');
      }

      toast.success('Emergency contact added successfully');
      setContacts(data.contacts);
      setIsAddDialogOpen(false);
      setNewContact({ name: '', mobile: '' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to add emergency contact');
    }
  };

  const handleDeleteContact = async (mobile: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/customer/emergency-contacts', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mobile }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete emergency contact');
      }

      toast.success('Emergency contact removed');
      setContacts(data.contacts);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete emergency contact');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading emergency contacts...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Emergency Contacts</CardTitle>
              <p className="text-sm text-muted-foreground">
                These contacts will be notified when you trigger an SOS alert
              </p>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Contact
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {contacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-center text-muted-foreground">
                No emergency contacts added yet
              </p>
              <p className="text-center text-sm text-muted-foreground">
                Add contacts who should be notified in case of emergency
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Contact
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {contacts.map((contact, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{contact.name}</p>
                      <p className="text-sm text-muted-foreground">{contact.mobile}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteContact(contact.mobile)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {contacts.length > 0 && (
            <div className="mt-4 rounded-lg bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> When you trigger an SOS alert, all these contacts will
                receive an SMS with your live location and trip details.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Contact Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Emergency Contact</DialogTitle>
            <DialogDescription>
              Add a trusted contact who will be notified during emergencies
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Contact Name</Label>
              <Input
                id="name"
                placeholder="e.g., John Doe"
                value={newContact.name}
                onChange={(e) =>
                  setNewContact({ ...newContact, name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number</Label>
              <Input
                id="mobile"
                type="tel"
                placeholder="10-digit mobile number"
                maxLength={10}
                value={newContact.mobile}
                onChange={(e) =>
                  setNewContact({
                    ...newContact,
                    mobile: e.target.value.replace(/\D/g, ''),
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Enter a 10-digit mobile number without country code
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddContact}>Add Contact</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
