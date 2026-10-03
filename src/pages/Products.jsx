import { useEffect, useState } from 'react';
import { api, money } from '../api';
import { PackagePlus, Pencil, Plus, Trash2 } from 'lucide-react';
import Dialog from '../components/Dialog';
import ProductPhotos from '../components/ProductPhotos';
import ProductGallery from '../components/ProductGallery';

export default function Products({ categories, onError }) {
  const [deleting, setDeleting] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [editing, setEditing] = useState(null);
  const [formError, setFormError] = useState('');
  const openEditor = (product = {}) => {
    setFormError('');
    setEditing(product);
  };
  const [products, setProducts] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    api(
      `/products${categoryId ? `?categoryId=${encodeURIComponent(categoryId)}` : ''}`,
    )
      .then((data) => {
        if (!Array.isArray(data))
          throw new Error('Unable to read products. Please retry.');
        if (active) {
          setProducts(data);
          setError('');
        }
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [categoryId, revision]);
  async function toggleFeatured(product) {
    setBusy(true);
    setError('');
    try {
      const updated = await api(`/products/${product.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ featuredimage: !product.featuredimage }),
      });
      setProducts((items) =>
        items.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (err) {
      setError(err.message);
      if ([401, 403].includes(err.status)) onError(err);
    } finally {
      setBusy(false);
    }
  }
  async function deleteProduct() {
    if (busy) return;
    setBusy(true);
    setDeleteError('');
    setMessage('');
    try {
      await api(`/products/${deleting.id}`, { method: 'DELETE' });
      setProducts((items) => items.filter((item) => item.id !== deleting.id));
      setMessage(`“${deleting.name}” deleted successfully.`);
      setDeleting(null);
    } catch (err) {
      setDeleteError(err.message);
      if ([401, 403].includes(err.status)) onError(err);
    } finally {
      setBusy(false);
    }
  }
  async function save(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const body = new FormData(form);
    body.set('featuredimage', String(form.elements.featuredimage.checked));
    for (const [key, value] of [...body.entries()]) {
      if (value === '' || (value instanceof File && !value.size))
        body.delete(key);
    }
    if (body.getAll('images').length > 5) {
      setFormError('Choose up to five detail images.');
      return;
    }
    setBusy(true);
    setError('');
    setMessage('');
    setFormError('');
    try {
      const payload = editing.id
        ? JSON.stringify({
            name: form.elements.name.value.trim(),
            description: form.elements.description.value,
            price: Number(form.elements.price.value),
            stock: Number(form.elements.stock.value),
            categoryId: form.elements.categoryId.value || null,
            isActive: form.elements.isActive.value === 'true',
            featuredimage: form.elements.featuredimage.checked,
          })
        : body;
      const product = await api(
        editing.id ? `/products/${editing.id}` : '/products',
        {
          method: editing.id ? 'PATCH' : 'POST',
          body: payload,
        },
      );
      setMessage(
        `“${product.name}” ${editing.id ? 'updated' : 'created'} successfully.`,
      );
      setEditing(null);
      setRevision((value) => value + 1);
    } catch (err) {
      setFormError(err.message);
      if ([401, 403].includes(err.status)) onError(err);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="admin-main">
      <div className="admin-heading">
        <div>
          <span className="eyebrow">YOUR COLLECTION</span>
          <h1>Products.</h1>
          <p>
            Manage your collection, update product details, and add something
            new.
          </p>
        </div>
        <button
          className="button primary"
          onClick={() => openEditor()}
        >
          <Plus size={18} /> Create product
        </button>
      </div>
      {error && (
        <p
          className="error"
          role="alert"
        >
          {error}
        </p>
      )}
      {message && (
        <p
          className="success"
          role="status"
        >
          {message}
        </p>
      )}
      <section className="category-panel">
        <div className="panel-heading">
          <h2>Products</h2>
          <label>
            Filter by category{' '}
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option
                  key={c.id}
                  value={c.id}
                >
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        {loading ? (
          <p
            className="empty-state"
            role="status"
          >
            Loading products…
          </p>
        ) : error ? (
          <div className="empty-state">
            <button
              className="button secondary"
              onClick={() => setRevision((value) => value + 1)}
            >
              Retry loading products
            </button>
          </div>
        ) : !products.length ? (
          <div className="empty-state product-empty">
            <div
              className="product-empty-art"
              role="img"
              aria-label="Add your first product"
            >
              <PackagePlus
                size={76}
                strokeWidth={1.2}
              />
            </div>
            <h3>
              {categoryId
                ? 'No products in this category yet.'
                : 'Your collection starts here.'}
            </h3>
            <p>
              {categoryId
                ? 'Choose another category or create a product.'
                : 'Add your first wallet with a photo, a price, and a few details.'}
            </p>
            <button
              className="button primary"
              onClick={() => openEditor()}
            >
              <Plus size={18} /> Add your first product
            </button>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="products-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th className="align-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td data-label="Product">
                      <strong>{p.name}</strong>
                      <ProductGallery
                        product={p}
                        compact
                      />
                      {/* <button
                        type="button"
                        role="switch"
                        aria-checked={p.featuredimage === true}
                        aria-label={`Feature ${p.name} in carousel`}
                        disabled={busy}
                        onClick={() => toggleFeatured(p)}
                        className="featured-toggle"
                      >
                        {p.featuredimage ? 'Featured: On' : 'Featured: Off'}
                      </button> */}
                    </td>
                    <td data-label="Category">
                      {p.category?.name || 'Uncategorised'}
                    </td>
                    <td data-label="Price">{money(p.price)}</td>
                    <td data-label="Stock">{p.stock}</td>
                    <td data-label="Status">
                      <span
                        className={`status-badge ${p.isActive ? 'is-active' : ''}`}
                      >
                        {p.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="button secondary"
                          disabled={busy}
                          aria-label={`Edit ${p.name}`}
                          onClick={() => openEditor(p)}
                        >
                          <Pencil size={16} /> Edit
                        </button>
                        <button
                          className="button secondary delete-button"
                          disabled={busy}
                          aria-label={`Delete ${p.name}`}
                          onClick={() => {
                            setDeleteError('');
                            setDeleting(p);
                          }}
                        >
                          <Trash2 size={16} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {editing && (
        <Dialog
          title={editing.id ? 'Edit product' : 'Create a product'}
          onClose={() => {
            if (!busy) setEditing(null);
          }}
        >
          <form
            className="product-form"
            onSubmit={save}
          >
            <p className="product-form-intro">
              {editing.id
                ? 'Keep your collection up to date.'
                : 'A few details and a great photo. Your next product starts here.'}
            </p>
            {editing.id && (
              <section
                className="saved-product-photos"
                aria-label="Saved product photos"
              >
                <h3>Product photos</h3>
                <p>Tap a photo to view it full size.</p>
                <ProductGallery product={editing} />
              </section>
            )}
            <div className="product-fields">
              <h3 className="product-section-title">
                <span>01</span> Product details
              </h3>
              <label>
                Name
                <input
                  placeholder="e.g. Everyday leather wallet"
                  name="name"
                  defaultValue={editing.name || ''}
                  required
                  maxLength={255}
                />
              </label>
              <label>
                Category
                <select
                  name="categoryId"
                  defaultValue={
                    editing.categoryId || editing.category?.id || ''
                  }
                >
                  <option value="">Uncategorised</option>
                  {categories.map((c) => (
                    <option
                      key={c.id}
                      value={c.id}
                    >
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Price (NPR)
                <input
                  inputMode="decimal"
                  placeholder="0.00"
                  name="price"
                  defaultValue={editing.price ?? ''}
                  type="number"
                  required
                  min="0"
                  step="0.01"
                />
              </label>
              <label>
                Stock
                <input
                  inputMode="numeric"
                  name="stock"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={editing.stock ?? 0}
                />
              </label>
              <label>
                Description
                <textarea
                  name="description"
                  defaultValue={editing.description || ''}
                  rows="3"
                />
              </label>
              <label>
                Visibility
                <select
                  name="isActive"
                  defaultValue={String(editing.isActive ?? true)}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </label>
              <label>
                Show in landing-page carousel
                <input
                  name="featuredimage"
                  defaultChecked={editing.featuredimage === true}
                  type="checkbox"
                  role="switch"
                />
                <small>
                  When enabled, the product cover image appears in the carousel.
                </small>
              </label>
              {!editing.id && (
                <>
                  <h3 className="product-section-title">
                    <span>02</span> Product photos
                  </h3>
                  <ProductPhotos />
                  <ProductPhotos multiple />
                </>
              )}
            </div>
            {formError && (
              <p
                className="error"
                role="alert"
              >
                {formError}
              </p>
            )}
            <div className="form-actions">
              <button
                type="button"
                className="button secondary"
                disabled={busy}
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>
              <button
                className="button primary"
                disabled={busy}
              >
                {busy
                  ? 'Saving…'
                  : editing.id
                    ? 'Save changes'
                    : 'Create product'}
              </button>
            </div>
          </form>
        </Dialog>
      )}
      {deleting && (
        <Dialog
          title="Delete product?"
          onClose={() => {
            if (!busy) setDeleting(null);
          }}
        >
          <p>
            “{deleting.name}” will be permanently removed from your collection.
            This cannot be undone.
          </p>
          {deleteError && (
            <p
              className="error"
              role="alert"
            >
              {deleteError}
            </p>
          )}
          <div className="form-actions">
            <button
              autoFocus
              className="button secondary"
              disabled={busy}
              onClick={() => setDeleting(null)}
            >
              Keep product
            </button>
            <button
              className="button danger"
              disabled={busy}
              onClick={deleteProduct}
            >
              {busy ? 'Deleting…' : 'Delete product'}
            </button>
          </div>
        </Dialog>
      )}
    </main>
  );
}
