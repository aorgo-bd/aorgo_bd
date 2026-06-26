"use client";

import React from "react";
import { useAdminAuditLogs } from "@/lib/hooks/useAdmin";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClipboardList, AlertCircle, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AuditLog } from "@/lib/types";

export default function AdminAuditPage() {
  const { data: logs = [], isLoading, refetch } = useAdminAuditLogs();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Security Audit Logs</h1>
          <p className="text-sm text-slate-500">Trace database manipulations, store approvals, and admin elevations.</p>
        </div>
        <button
          onClick={() => refetch()}
          className="inline-flex h-9 items-center justify-center gap-1.5 border border-gray-200 hover:border-black rounded-lg px-4 text-xs font-bold transition-all bg-white"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-black border-t-transparent"></div>
          <p className="text-sm text-slate-500">Loading audit history...</p>
        </div>
      ) : logs.length > 0 ? (
        <div className="overflow-hidden border border-slate-200 rounded-xl bg-white shadow-sm">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="font-bold text-xs py-4">Actor UID</TableHead>
                <TableHead className="font-bold text-xs">Role</TableHead>
                <TableHead className="font-bold text-xs">Action Tag</TableHead>
                <TableHead className="font-bold text-xs">Entity Type</TableHead>
                <TableHead className="font-bold text-xs">Entity ID</TableHead>
                <TableHead className="font-bold text-xs">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-150">
              {logs.map((log: AuditLog) => (
                <TableRow key={log.id} className="hover:bg-slate-50/30 transition-colors">
                  <TableCell className="py-4 text-xs font-mono font-semibold text-slate-700">
                    {log.actorUid}
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge
                      className={`text-[9px] uppercase font-bold px-2 py-0.5 border ${
                        log.actorRole === "admin"
                          ? "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100"
                          : log.actorRole === "seller"
                          ? "bg-violet-50 text-violet-700 border-violet-100"
                          : "bg-blue-50 text-blue-700 border-blue-100"
                      }`}
                      variant="secondary"
                    >
                      {log.actorRole}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4 text-xs font-bold text-slate-800">
                    {log.action}
                  </TableCell>
                  <TableCell className="py-4 text-xs font-semibold text-slate-500 capitalize">
                    {log.entity}
                  </TableCell>
                  <TableCell className="py-4 text-xs font-mono text-slate-400">
                    {log.entityId}
                  </TableCell>
                  <TableCell className="py-4 text-xs text-slate-450">
                    {new Date(log.at).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-16 text-slate-400 bg-white border border-slate-150 rounded-2xl">
          <ClipboardList className="h-10 w-10 mx-auto mb-2 text-slate-350" />
          <p className="font-semibold text-slate-700">No logs documented yet</p>
          <p className="text-xs text-slate-400">Audit logs are populated automatically when operations are executed.</p>
        </div>
      )}
    </div>
  );
}
