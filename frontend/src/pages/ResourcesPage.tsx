// frontend/src/pages/ResourcesPage.tsx

import React, { useState, useEffect, useCallback } from "react";
import api from "../api/api";
import "./ResourcesPage.css"; // We'll create this next
import axios, { AxiosError } from "axios";
import type { BackendErrorResponse } from "../types/index"; // Assuming you have this type

// Define type for a single resource item
interface Resource {
  id: number;
  title: string;
  description?: string;
  url: string;
  category: string; // e.g., 'vegan cooks', 'gardening'
  image_url?: string;
  created_at: string;
  updated_at: string;
}

// Helper to capitalize first letter of each word
const capitalizeWords = (str: string) => {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
};

const ResourcesPage: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All"); // State for selected filter
  const [uniqueCategories, setUniqueCategories] = useState<string[]>(["All"]); // State for available categories

  // Function to fetch resources from the backend
  const fetchResources = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params =
        selectedCategory === "All" ? {} : { category: selectedCategory };
      const response = await api.get<Resource[]>("/resources", { params });
      setResources(response.data);

      // Extract unique categories from fetched resources for the filter dropdown
      // This should ideally only run once on initial fetch, or if a resource is added/deleted
      // but for simplicity, we'll extract from filtered data for now.
      // In a more complex app, categories might come from a dedicated /data/resource_categories endpoint.
      if (selectedCategory === "All" && response.data.length > 0) {
        const categories = new Set<string>();
        response.data.forEach((res) =>
          categories.add(res.category.toLowerCase())
        );
        setUniqueCategories(["All", ...Array.from(categories).sort()]);
      }
    } catch (err: unknown) {
      if (axios.isAxiosError<BackendErrorResponse>(err)) {
        console.error(
          "Error fetching resources:",
          err.response?.data || err.message
        );
        setError(err.response?.data?.message || "Failed to load resources.");
      } else if (err instanceof Error) {
        console.error("Error fetching resources:", err.message);
        setError(err.message || "Failed to load resources.");
      } else {
        console.error("An unknown error occurred fetching resources:", err);
        setError(`An unknown error occurred: ${String(err)}`);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]); // Re-fetch when selectedCategory changes

  useEffect(() => {
    fetchResources();
  }, [fetchResources]); // Initial fetch and re-fetch when filter changes

  if (loading) {
    return <div className="resources-container">Loading resources...</div>;
  }

  if (error) {
    return (
      <div className="resources-container error-message">Error: {error}</div>
    );
  }

  console.log(resources);

  return (
    <div className="resources-container">
      <header className="resources-header">
        <h1 className="resources-title">The Path to a Better Life</h1>
        <p className="resources-subtitle">
          Beyond recipes, find inspiration, knowledge, and tools to live a
          healthier, more sustainable, and joyful plant-forward lifestyle.
        </p>
        <p className="resources-intro-text">
          Whether you're curious about growing your own food, seeking new
          plant-based culinary heroes, or exploring sustainable living tips,
          this hub is for you. We curate links to chefs, gardeners,
          masterclasses, and thought leaders who are paving the way.
        </p>
      </header>

      <section className="resources-filters">
        <label htmlFor="category-filter">Filter by Category:</label>
        <select
          id="category-filter"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="resources-filter-select"
        >
          {uniqueCategories.map((cat) => (
            <option key={cat} value={cat}>
              {capitalizeWords(cat)}
            </option>
          ))}
        </select>
      </section>

      <section className="resources-grid-section">
        {resources.length === 0 ? (
          <p className="no-resources-message">
            No resources found for the selected category.
          </p>
        ) : (
          <div className="resources-grid">
            {resources.map((resource) => (
              <a
                key={resource.id}
                href={resource.url}
                target="_blank" // Open in new tab
                rel="noopener noreferrer" // Security best practice for target="_blank"
                className="resource-card"
              >
                {resource.image_url && (
                  <img
                    src={resource.image_url}
                    alt={resource.title}
                    className="resource-card-image"
                  />
                )}
                <div className="resource-card-content">
                  <h3 className="resource-card-title">{resource.title}</h3>
                  {resource.description && (
                    <p className="resource-card-description">
                      {resource.description}
                    </p>
                  )}
                  <span className="resource-card-category">
                    {capitalizeWords(resource.category)}
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default ResourcesPage;
