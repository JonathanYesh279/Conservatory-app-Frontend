import { httpService } from './httpService';

export interface Orchestra {
  _id: string;
  name: string;
  type: string;
  conductorId: string;
  memberIds: string[];
  rehearsalIds: string[];
  schoolYearId: string;
  isActive: boolean;
}

export interface OrchestraFilter {
  name?: string;
  type?: string;
  conductorId?: string;
  memberIds?: string;
  schoolYearId?: string;
  isActive?: boolean;
  showInactive?: boolean;
}

export const orchestraService = {
  async getOrchestras(filterBy: OrchestraFilter = {}): Promise<Orchestra[]> {
    return httpService.get('orchestra', filterBy);
  },

  async getOrchestraById(orchestraId: string): Promise<Orchestra> {
    return httpService.get(`orchestra/${orchestraId}`);
  },

  async getOrchestrasByIds(orchestraIds: string[]): Promise<Orchestra[]> {
    // If no ids provided, return empty array
    if (!orchestraIds || orchestraIds.length === 0) {
      return [];
    }

    // Fetch orchestras with memberIds filter
    // Alternative approach would be to add a new endpoint that accepts an array of IDs
    const allOrchestras = await this.getOrchestras();
    return allOrchestras.filter((orchestra) =>
      orchestraIds.includes(orchestra._id)
    );
  },

  async addOrchestra(orchestra: Partial<Orchestra>): Promise<Orchestra> {
    return httpService.post('orchestra', orchestra);
  },

  async updateOrchestra(
    orchestraId: string,
    orchestra: Partial<Orchestra>
  ): Promise<Orchestra> {
    return httpService.put(`orchestra/${orchestraId}`, orchestra);
  },

  async removeOrchestra(orchestraId: string): Promise<Orchestra> {
    return httpService.delete(`orchestra/${orchestraId}`);
  },
};
