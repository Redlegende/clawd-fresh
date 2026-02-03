"use client"

import { useCallback } from 'react'
import { Task } from '@/lib/supabase/client'

interface UseTaskSyncOptions {
  onError?: (error: Error) => void
}

/**
 * Hook to sync task changes to Fred via webhook
 * 
 * Usage:
 * const { notifyTaskCompleted, notifyTaskCreated } = useTaskSync()
 * 
 * // When task is marked done
 * await notifyTaskCompleted(task)
 */
export function useTaskSync(options: UseTaskSyncOptions = {}) {
  const sendWebhook = useCallback(async (
    event: string,
    task: Task,
    previousData?: Partial<Task>
  ) => {
    try {
      const payload = {
        event,
        timestamp: new Date().toISOString(),
        task: {
          id: task.id,
          title: task.title,
          description: task.description,
          status: task.status,
          previous_status: previousData?.status,
          priority: task.priority,
          project_id: task.project_id,
          due_date: task.due_date,
          completed_by: 'jakob', // Or get from auth context
          completed_at: task.status === 'done' ? new Date().toISOString() : undefined,
          updated_by: 'jakob'
        }
      }

      const response = await fetch('/api/webhooks/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': 'temp-signature' // TODO: Implement HMAC
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status}`)
      }

      console.log(`[TaskSync] Sent ${event} for:`, task.title)
      return await response.json()

    } catch (error) {
      console.error('[TaskSync] Failed to send webhook:', error)
      options.onError?.(error as Error)
      throw error
    }
  }, [options])

  const notifyTaskCompleted = useCallback(async (task: Task) => {
    return sendWebhook('task.completed', task, { status: 'in_progress' })
  }, [sendWebhook])

  const notifyTaskCreated = useCallback(async (task: Task) => {
    return sendWebhook('task.created', task)
  }, [sendWebhook])

  const notifyTaskUpdated = useCallback(async (
    task: Task, 
    previousData: Partial<Task>
  ) => {
    return sendWebhook('task.updated', task, previousData)
  }, [sendWebhook])

  const notifyTaskRescheduled = useCallback(async (
    task: Task,
    previousDueDate?: string
  ) => {
    return sendWebhook('task.rescheduled', task, { due_date: previousDueDate })
  }, [sendWebhook])

  return {
    notifyTaskCompleted,
    notifyTaskCreated,
    notifyTaskUpdated,
    notifyTaskRescheduled,
    sendWebhook
  }
}
