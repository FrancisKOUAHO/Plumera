import { HttpContext } from '@adonisjs/core/http'
import axios from 'axios'
import PublicBusinessData from '#models/public_business_data'
import env from '#start/env'

interface TypeVoieDictionary {
  [key: string]: string
}

const typeVoieDictionary: TypeVoieDictionary = {
  ALL: 'Allée',
  AV: 'Avenue',
  BD: 'Boulevard',
  CH: 'Chemin',
  CHEM: 'Chemin',
  IMP: 'Impasse',
  PL: 'Place',
  PT: 'Petite Route',
  RLE: 'Ruelle',
  RUE: 'Rue',
  SQ: 'Square',
  CRS: 'Cours',
  ESP: 'Esplanade',
  FBG: 'Faubourg',
  GDE: 'Grande',
  PAS: 'Passage',
  PCE: 'Place',
  QAI: 'Quai',
  RPT: 'Rond-Point',
  RT: 'Route',
  SENT: 'Sentier',
  TSSE: 'Terrasse',
  VLA: 'Villa',
  VOIE: 'Voie',
  CARF: 'Carrefour',
  CG: 'Chaussée',
  CITÉ: 'Cité',
  CLOS: 'Clos',
  CNE: 'Corniche',
  DOM: 'Domaine',
  LOT: 'Lotissement',
  MAIL: 'Mail',
  PARC: 'Parc',
  QU: 'Quartier',
}

interface CachedToken {
  value: string | null
  expiry: number | null
}

let cachedToken: CachedToken = {
  value: null,
  expiry: null,
}

export default class ScrappersController {
  getFullTypeVoie(abbreviation: string): string {
    const upperAbbreviation = abbreviation.toUpperCase()
    return typeVoieDictionary[upperAbbreviation] || abbreviation
  }

  async sirene({ request, response, auth }: HttpContext) {
    const user = auth.user!

    const siren_number = request.input('siren_number')
    let firstName: string
    let lastNname: string
    let city: string
    let zip: string
    let country: string

    try {
      const token = await this.authenticate()
      if (!token) {
        return response.internalServerError('Failed to authenticate with SIRENE API')
      }

      const url = `https://registre-national-entreprises.inpi.fr/api/companies/${siren_number}`
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }

      const clientResponse = await axios.get(url, { headers })

      if (clientResponse.data && clientResponse.data.formality) {
        const data = clientResponse.data

        const typePersonne: any = data.formality.content.personnePhysique
          ? data.formality.content.personnePhysique
          : data.formality.content.personneMorale

        if (data.formality.content.personnePhysique) {
          firstName = typePersonne.identite.entrepreneur.descriptionPersonne.nom
          lastNname = typePersonne.identite.entrepreneur.descriptionPersonne.prenoms[0]
        } else {
          if (typePersonne.beneficiairesEffectifs.length > 1) {
            firstName = typePersonne.beneficiairesEffectifs[0].beneficiaire.descriptionPersonne.nom
            lastNname =
              typePersonne.beneficiairesEffectifs[0].beneficiaire.descriptionPersonne.prenoms[0]
          } else {
            firstName = typePersonne.beneficiairesEffectifs.beneficiaire.descriptionPersonne.nom
            lastNname =
              typePersonne.beneficiairesEffectifs.beneficiaire.descriptionPersonne.prenoms[0]
          }
        }

        const companyName: string =
          typePersonne.etablissementPrincipal.descriptionEtablissement.nomCommercial ??
          typePersonne.identite.entreprise.denomination

        city = typePersonne.adresseEntreprise.adresse.commune ?? ''
        zip = typePersonne.adresseEntreprise.adresse.codePostal ?? ''
        country = typePersonne.adresseEntreprise.adresse.pays ?? ''

        const fullTypeVoie =
          typePersonne.adresseEntreprise.adresse.numVoie +
            this.getFullTypeVoie(typePersonne.adresseEntreprise.adresse.typeVoie) +
            typePersonne.adresseEntreprise.adresse.voie ?? ''

        const publicBusinessData = await PublicBusinessData.create({
          user_id: user.id,
          first_name: firstName,
          last_name: lastNname,
          email: '',
          siren_number: siren_number,
          phone: '',
          address: fullTypeVoie,
          city: city,
          state: '',
          zip: zip,
          country: country,
          company: companyName,
          legal_structure: '',
          legal_status: '',
          vat_number: '',
          currency: 'EUR',
          language: 'FR',
        })

        return response.ok(publicBusinessData)
      }
      return response.notFound('No data found for the provided SIREN number.')
    } catch (error) {
      return this.handleErrorResponse(error, response)
    }
  }

  async getSireneInfo({ request, response }: HttpContext) {
    const siren_number = request.input('siren_number')
    let firstName: string
    let lastNname: string
    let city: string
    let zip: string
    let country: string

    try {
      const token = await this.authenticate()
      if (!token) {
        return response.internalServerError('Failed to authenticate with SIRENE API')
      }

      const url = `https://registre-national-entreprises.inpi.fr/api/companies/${siren_number}`
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }

      const clientResponse = await axios.get(url, { headers })

      if (clientResponse.data && clientResponse.data.formality) {
        const data = clientResponse.data

        const typePersonne: any = data.formality.content.personnePhysique
          ? data.formality.content.personnePhysique
          : data.formality.content.personneMorale

        if (data.formality.content.personnePhysique) {
          firstName = typePersonne.identite.entrepreneur.descriptionPersonne.nom
          lastNname = typePersonne.identite.entrepreneur.descriptionPersonne.prenoms[0]
        } else {
          if (typePersonne.beneficiairesEffectifs.length > 1) {
            firstName = typePersonne.beneficiairesEffectifs[0].beneficiaire.descriptionPersonne.nom
            lastNname =
              typePersonne.beneficiairesEffectifs[0].beneficiaire.descriptionPersonne.prenoms[0]
          } else {
            firstName = typePersonne.beneficiairesEffectifs.beneficiaire.descriptionPersonne.nom
            lastNname =
              typePersonne.beneficiairesEffectifs.beneficiaire.descriptionPersonne.prenoms[0]
          }
        }

        const companyName: string =
          typePersonne.etablissementPrincipal.descriptionEtablissement.nomCommercial ??
          typePersonne.identite.entreprise.denomination

        city = typePersonne.adresseEntreprise.adresse.commune ?? ''
        zip = typePersonne.adresseEntreprise.adresse.codePostal ?? ''
        country = typePersonne.adresseEntreprise.adresse.pays ?? ''

        const fullTypeVoie =
          typePersonne.adresseEntreprise.adresse.numVoie +
            this.getFullTypeVoie(typePersonne.adresseEntreprise.adresse.typeVoie) +
            typePersonne.adresseEntreprise.adresse.voie ?? ''

        const clientData = {
          first_name: firstName,
          last_name: lastNname,
          email: '',
          sirenNumber: siren_number,
          phone: '',
          address: fullTypeVoie,
          city: city,
          state: '',
          zip: zip,
          country: country,
          company: companyName,
          vat_number: '',
          currency: 'EUR',
          language: 'FR',
        }
        return response.ok(clientData)
      }
      return response.notFound('No data found for the provided SIREN number.')
    } catch (error) {
      return this.handleErrorResponse(error, response)
    }
  }

  async authenticate(): Promise<string> {
    const expiresIn = 3600 * 1000

    if (cachedToken && cachedToken.expiry && cachedToken.value && cachedToken.expiry > Date.now()) {
      return cachedToken.value
    }

    try {
      const response = await axios.post(
        'https://registre-national-entreprises.inpi.fr/api/sso/login',
        {
          username: env.get('INPI_EMAIL'),
          password: env.get('INPI_PASSWORD'),
        }
      )

      const { token } = response.data
      const lastLoginTime = new Date(response.data.user.lastLogin).getTime()

      const expiryTime = lastLoginTime + expiresIn

      cachedToken = {
        value: token,
        expiry: expiryTime,
      }

      return token
    } catch (error) {
      throw new Error('Authentication failed')
    }
  }

  handleErrorResponse(error: any, response: HttpContext['response']) {
    if (error.response) {
      return response.status(error.response.status).send(error.response.data)
    } else if (error.request) {
      return response.internalServerError('Error setting up request to SIRENE API.')
    } else {
      return response.internalServerError('Error setting up request to SIRENE API.')
    }
  }
}
