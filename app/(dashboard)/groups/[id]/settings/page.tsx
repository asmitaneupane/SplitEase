'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Field, FieldLabel } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { CURRENCIES } from '@/lib/currency'
import { ArrowLeft, Settings, Trash2, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import type { Group } from '@/lib/types'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function GroupSettingsPage({ params }: PageProps) {
  const { id: groupId } = use(params)
  const [group, setGroup] = useState<Group | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [currency, setCurrency] = useState('NPR')
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [fetchingData, setFetchingData] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function fetchGroup() {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(groupId);
      let groupData;

      if (isUUID) {
        const { data } = await supabase.from('groups').select('*').eq('id', groupId).single();
        groupData = data;
      }

      if (!groupData) {
        const { data } = await supabase.from('groups').select('*').eq('slug', groupId).single();
        groupData = data;
      }

      if (groupData) {
        setGroup(groupData)
        setName(groupData.name)
        setDescription(groupData.description || '')
        setCurrency(groupData.currency)
      }
      setFetchingData(false)
    }
    fetchGroup()
  }, [groupId, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(groupId);
      let realGroupId = groupId;

      if (!isUUID) {
        const { data } = await supabase.from('groups').select('id').eq('slug', groupId).single();
        if (data) realGroupId = data.id;
      }

      const { error: updateError } = await supabase
        .from('groups')
        .update({
          name,
          description: description || null,
          currency,
          updated_at: new Date().toISOString(),
        })
        .eq('id', realGroupId)

      if (updateError) throw updateError

      setSuccess(true)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update group')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(groupId);
      let realGroupId = groupId;

      if (!isUUID) {
        const { data } = await supabase.from('groups').select('id').eq('slug', groupId).single();
        if (data) realGroupId = data.id;
      }

      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', realGroupId)

      if (error) throw error

      router.push('/groups')
      router.refresh()
    } catch (err) {
      console.error('Failed to delete group:', err)
      setDeleting(false)
    }
  }

  if (fetchingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/groups/${group?.slug || groupId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Group Settings</h1>
          <p className="text-muted-foreground">{group?.name}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
            <Settings className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Group Details</CardTitle>
          <CardDescription>Update group information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field>
              <FieldLabel htmlFor="name">Group Name</FieldLabel>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="description">Description</FieldLabel>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="currency">Currency</FieldLabel>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.symbol} {c.name} ({c.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 text-sm text-success bg-success/10 rounded-lg flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Group updated successfully
              </div>
            )}

            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? <Spinner className="h-4 w-4" /> : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center mb-2">
            <Trash2 className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Permanently delete this group and all its data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Group
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the group
                  <span className="font-semibold"> {group?.name}</span> and all associated
                  expenses, members, and settlements.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={deleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting ? <Spinner className="h-4 w-4" /> : 'Delete Group'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  )
}
