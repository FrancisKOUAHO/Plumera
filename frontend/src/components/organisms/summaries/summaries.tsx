'use client'

import React, { useState, useEffect, FunctionComponent } from 'react'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import api from '@/config/api'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import {
  MoreHorizontal,
  Trash,
  Edit,
  FileImage,
  ArrowDownToLine,
} from 'lucide-react'
import DeleteCustomer from '@/components/molecules/modal/customer/DeleteCustomer'
import { InvoiceType, InvoiceStatus } from '@/types/InvoiceProps'
import Invoice from '@/components/molecules/modal/invoice/invoice'
import EditInvoice from '@/components/molecules/forms/invoice/edit-invoice'
import { downloadPDF } from '@/lib/download-pdf'

interface InvoiceProps {
  invoices: InvoiceType[]
  setInvoices: React.Dispatch<React.SetStateAction<InvoiceType[]>>
}

const Summaries: FunctionComponent<InvoiceProps> = ({
  invoices,
  setInvoices,
}) => {
  const [checked, setChecked] = useState(false)
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
  const [isDeleteModalOpen, setDeleteModalOpen] = useState<boolean>(false)
  const [invoiceIdToDelete, setInvoiceIdToDelete] = useState<string | null>(
    null,
  )
  const [invoiceId, setInvoiceId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) {
      return ''
    }

    const date = new Date(dateString)

    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const toggleDropdown = (id: string | undefined) => {
    setOpenDropdownId((prevId) => (prevId === id ? null : id || null))
  }

  const updateStatus = async (id: string, status: InvoiceStatus) => {
    try {
      const response = await api.put(`billing/invoice/${id}`, { status })
      if (response.status === 200) {
        setInvoices((invoices) =>
          invoices.map((invoice) => {
            if (invoice.id === id) {
              return { ...invoice, status }
            }
            return invoice
          }),
        )
      } else {
        console.error('Failed to update the invoice status:', response)
      }
    } catch (error) {
      console.error('Error updating the invoice status:', error)
    }
  }

  const openDeleteModal = (invoiceId: string | undefined) => {
    setInvoiceIdToDelete(invoiceId || null)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    try {
      if (invoiceIdToDelete) {
        try {
          const response = await api.delete(
            `billing/invoice/${invoiceIdToDelete}`,
          )
        } catch (error: unknown) {
          throw new Error('Failed to delete client: ' + error)
        }
        setInvoices((invoices: InvoiceType[]): InvoiceType[] =>
          invoices.filter((invoice) => invoice.id !== invoiceIdToDelete),
        )
        setDeleteModalOpen(false)
        setInvoiceIdToDelete(null)
      }
    } catch (error) {}
  }

  const openMdalEdit = (invoiceId: string) => {
    setInvoiceId(invoiceId)
    setIsModalOpen(true)
  }

  return (
    <section>
      <header className="flex justify-end items-center mt-4">
        <div className="relative text-gray-600">
          <input
            className="border-2 border-gray-300 bg-white h-10 px-5 pr-16 rounded-lg text-sm focus:outline-none"
            type="search"
            name="search"
            placeholder="Rechercher"
          />
          <button type="submit" className="absolute right-0 top-0 mt-3 mr-4">
            <svg
              className="text-gray-600 h-4 w-4 fill-current"
              x="0px"
              y="0px"
              viewBox="0 0 56.966 56.966"
              xmlSpace="preserve"
              width="512px"
              height="512px"
            >
              <path d="M55.146,51.887L41.588,37.786c3.486-4.144,5.396-9.358,5.396-14.786c0-12.682-10.318-23-23-23s-23,10.318-23,23  s10.318,23,23,23c4.761,0,9.298-1.436,13.177-4.162l13.661,14.208c0.571,0.593,1.339,0.92,2.162,0.92  c0.779,0,1.518-0.297,2.079-0.837C56.255,54.982,56.293,53.08,55.146,51.887z M23.984,6c9.374,0,17,7.626,17,17s-7.626,17-17,17  s-17-7.626-17-17S14.61,6,23.984,6z" />
            </svg>
          </button>
        </div>
      </header>

      <div className="mt-6">
        <table className="table w-full text-black border-separate space-y-6 text-sm">
          <thead>
            <tr>
              <th className="p-3 text-center">Nom</th>
              <th className="p-3 text-center">Prix</th>
              <th className="p-3 text-center">Client</th>
              <th className="p-3 text-center">Statut</th>
              <th className="p-3 text-center">Date</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {invoices &&
              invoices.map((invoice: InvoiceType) => (
                <tr key={invoice.id} className="bg-[#e7effc]">
                  <td className="p-3 text-center">
                    {invoice?.client?.firstName}
                  </td>
                  <td className="p-3 text-center">{invoice?.totalAmount}€</td>
                  <td className="p-3 text-center">
                    {invoice?.client?.firstName} {invoice?.client?.lastName}
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`bg-${invoice?.status === 'payé' ? 'green-200' : 'red-200'} text-${invoice?.status === 'payé' ? 'green-600' : 'red-600'} py-1 px-3 rounded-full text-xs`}
                    >
                      {invoice?.status}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    {formatDate(invoice?.createdAt ?? '')}
                  </td>
                  <td className="p-3 text-center">
                    <DropdownMenu
                      open={openDropdownId === invoice.id}
                      onOpenChange={() => toggleDropdown(invoice.id)}
                    >
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[200px]">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuGroup>
                          <DropdownMenuItem
                            onClick={() => downloadPDF(true, invoice.id)}
                          >
                            <ArrowDownToLine className="mr-2 h-4 w-4" />
                            Télecharger la facture
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <p
                              onClick={() => openMdalEdit(invoice.id)}
                              className="flex items-center"
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              <span>Modifier</span>{' '}
                            </p>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openDeleteModal(invoice.id)}
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuLabel>Statut</DropdownMenuLabel>
                        <DropdownMenuGroup>
                          <DropdownMenuItem
                            onClick={() => updateStatus(invoice.id, 'envoyé')}
                          >
                            Envoyé
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              updateStatus(invoice.id, 'brouillon')
                            }
                          >
                            <span>Brouillon</span>{' '}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => updateStatus(invoice.id, 'payé')}
                          >
                            <span>Payé</span>{' '}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => updateStatus(invoice.id, 'caduque')}
                          >
                            <span>Caduque</span>{' '}
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <DeleteCustomer
        isOpen={isDeleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
      />

      <Invoice
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        children={
          <EditInvoice setIsModalOpen={setIsModalOpen} invoiceId={invoiceId} />
        }
      />
    </section>
  )
}

export default Summaries
