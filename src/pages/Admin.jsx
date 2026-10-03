import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  Folder,
  LayoutGrid,
  LogOut,
  Pencil,
  Package,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { api } from '../api';
import Products from './Products';
import Brand from '../components/Brand';
import Dialog from '../components/Dialog';

export default function Admin() {
  const [section, setSection] = useState('products');
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [name, setName] = useState('');

  const handleError = (requestError) => {
    setError(requestError.message);
    if (requestError.status === 401 || requestError.status === 403) {
      setUser(null);
      setEditing(null);
      setDeleting(null);
    }
  };

  const loadCategories = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api('/category');
      if (!Array.isArray(data))
        throw new Error('Unable to read categories. Please retry.');
      setCategories(data);
    } catch (requestError) {
      handleError(requestError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api('/auth/me')
      .then((profile) => {
        if (profile.role === 'admin') setUser(profile);
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);

  useEffect(() => {
    if (user) loadCategories();
  }, [user]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password }),
      });
      if (result.role !== 'admin') {
        await api('/auth/logout', { method: 'POST' });
        throw new Error('This account does not have administrator access.');
      }
      setSection('products');
      setUser(result.user);
      setPassword('');
    } catch (requestError) {
      handleError(requestError);
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    setBusy(true);
    try {
      await api('/auth/logout', { method: 'POST' });
      setUser(null);
      setCategories([]);
      setMessage('');
      setError('');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const saveCategory = async (event) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Please enter a category name.');
      return;
    }
    if (
      categories.some(
        (category) =>
          category.id !== editing.id &&
          category.name.toLowerCase() === trimmedName.toLowerCase(),
      )
    ) {
      setError('A category with this name already exists.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const updated = await api(
        editing.id ? `/category/${editing.id}` : '/category',
        {
          method: editing.id ? 'PATCH' : 'POST',
          body: JSON.stringify({ name: trimmedName }),
        },
      );
      setCategories((previous) =>
        editing.id
          ? previous.map((category) =>
              category.id === updated.id ? updated : category,
            )
          : [updated, ...previous],
      );
      setMessage(
        `“${updated.name}” ${editing.id ? 'updated' : 'added'} successfully.`,
      );
      setEditing(null);
    } catch (requestError) {
      handleError(requestError);
    } finally {
      setBusy(false);
    }
  };

  const deleteCategory = async () => {
    setBusy(true);
    setError('');
    try {
      await api(`/category/${deleting.id}`, { method: 'DELETE' });
      setCategories((previous) =>
        previous.filter((category) => category.id !== deleting.id),
      );
      setMessage(`“${deleting.name}” deleted.`);
      setDeleting(null);
    } catch (requestError) {
      handleError(requestError);
    } finally {
      setBusy(false);
    }
  };

  const openEditor = (category) => {
    setEditing(category || {});
    setName(category?.name || '');
    setError('');
    setMessage('');
  };

  if (checking)
    return <main className="empty-state">Checking your session…</main>;
  if (!user)
    return (
      <div className="login-page">
        <div className="login-story">
          <Brand light />
          <div>
            <span className="eyebrow">THE OTHER SIDE OF THE COUNTER</span>
            <h1>
              A little care.
              <br />
              Behind every
              <br />
              <em>collection.</em>
            </h1>
            <p>Your space to keep WalletMandu organised.</p>
          </div>
          <span>Nepal · WalletMandu</span>
        </div>
        <main className="login-main">
          <a
            className="text-link back-store"
            href={
              import.meta.env.VITE_STOREFRONT_URL || 'http://localhost:5173'
            }
          >
            <ArrowLeft size={16} /> Back to the store
          </a>
          <form
            onSubmit={handleLogin}
            className="login-form"
          >
            <span className="eyebrow">WALLETMANDU ADMIN</span>
            <h2>Welcome back.</h2>
            <p>Sign in to manage your products and categories.</p>
            <label>
              Email address
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@yourcompany.com"
              />
            </label>
            <label>
              Password
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            {error && (
              <p
                className="error"
                role="alert"
              >
                {error}
              </p>
            )}
            <button
              disabled={busy}
              className="button primary full-width"
            >
              {busy ? 'Signing in…' : 'Sign in'}
              <ArrowUpRight size={18} />
            </button>
            <p className="login-hint">
              Access is reserved for existing administrator accounts.
            </p>
          </form>
        </main>
      </div>
    );
  const visibleCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <Brand />
        <span className="eyebrow">STORE WORKSPACE</span>
        <button
          className={`sidebar-link ${section === 'products' ? 'active' : ''}`}
          onClick={() => setSection('products')}
        >
          <Package size={19} /> Products
        </button>
        <button
          className={`sidebar-link ${section === 'categories' ? 'active' : ''}`}
          onClick={() => setSection('categories')}
        >
          <LayoutGrid size={19} /> Categories
        </button>
        <a
          className="sidebar-link"
          href={import.meta.env.VITE_STOREFRONT_URL || 'http://localhost:5173'}
        >
          <ArrowUpRight size={19} /> View storefront
        </a>
        <div className="sidebar-bottom">
          <span className="avatar">
            {user.email?.[0]?.toUpperCase() || 'A'}
          </span>
          <div>
            <strong>Administrator</strong>
            <small>{user.email}</small>
          </div>
          <button
            className="icon-button"
            aria-label="Sign out"
            onClick={handleLogout}
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>
      {section === 'products' ? (
        <Products
          categories={categories}
          onError={handleError}
        />
      ) : (
        <main className="admin-main">
          <div className="admin-breadcrumb">
            Workspace <span>/</span> Categories
          </div>
          <div className="admin-heading">
            <div>
              <span className="eyebrow">KEEP THINGS IN ORDER</span>
              <h1>
                Categories<span className="brand-period">.</span>
              </h1>
              <p>A thoughtful collection starts with a little organisation.</p>
            </div>
            <button
              className="button primary"
              onClick={() => openEditor()}
            >
              <Plus size={18} /> Add category
            </button>
          </div>
          <div className="admin-stat">
            <Folder size={23} />
            <div>
              <strong>{categories.length}</strong>
              <span>Total categories</span>
            </div>
            <p>
              Categories appear as filters
              <br />
              in your storefront collection.
            </p>
          </div>
          {message && (
            <p
              className="success"
              role="status"
            >
              {message}
            </p>
          )}
          {error && !editing && !deleting && (
            <div
              className="error"
              role="alert"
            >
              {error}{' '}
              <button
                className="text-link"
                onClick={loadCategories}
              >
                Retry
              </button>
            </div>
          )}
          <section className="category-panel">
            <div className="panel-heading">
              <h2>
                All categories <span>{categories.length}</span>
              </h2>
              <label className="search-field">
                <Search size={17} />
                <span className="sr-only">Search categories</span>
                <input
                  placeholder="Search categories…"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Category name</th>
                    <th>Created</th>
                    <th className="align-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {!loading &&
                    visibleCategories.map((category) => (
                      <tr key={category.id}>
                        <td>
                          <span className="category-symbol">
                            <Folder size={17} />
                          </span>
                          <strong>{category.name}</strong>
                        </td>
                        <td>
                          {category.createdAt
                            ? new Date(category.createdAt).toLocaleDateString(
                                'en-GB',
                                {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  timeZone: 'Asia/Kathmandu',
                                },
                              )
                            : '—'}
                        </td>
                        <td>
                          <div className="table-actions">
                            <button
                              className="icon-button"
                              aria-label={`Edit ${category.name}`}
                              onClick={() => openEditor(category)}
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              className="icon-button delete-button"
                              aria-label={`Delete ${category.name}`}
                              onClick={() => {
                                setDeleting(category);
                                setError('');
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {loading ? (
              <div
                className="empty-state"
                role="status"
              >
                Loading categories…
              </div>
            ) : (
              !visibleCategories.length && (
                <div className="empty-state">
                  <Folder size={30} />
                  <h3>
                    {query
                      ? 'No matching categories.'
                      : 'Make room for your collection.'}
                  </h3>
                  <p>
                    {query
                      ? 'Try another name.'
                      : 'Add your first category to get started.'}
                  </p>
                  {!query && (
                    <button
                      className="text-link"
                      onClick={() => openEditor()}
                    >
                      Add a category <Plus size={16} />
                    </button>
                  )}
                </div>
              )
            )}
            <div className="panel-footer">
              {visibleCategories.length}{' '}
              {visibleCategories.length === 1 ? 'category' : 'categories'}
              <span>WalletMandu / Store management</span>
            </div>
          </section>
        </main>
      )}
      {editing && (
        <Dialog
          title={editing.id ? 'Edit category' : 'Add a category'}
          onClose={() => {
            if (!busy) setEditing(null);
          }}
        >
          <form
            onSubmit={saveCategory}
            className="category-form"
          >
            <p>Give this part of your collection a simple, clear name.</p>
            <label>
              Category name
              <input
                autoFocus
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                maxLength={100}
                placeholder="e.g. Bifolds"
              />
            </label>
            <span className="field-hint">
              Shown to customers in the collection filters. {name.length}/100
            </span>
            {error && (
              <p
                className="error"
                role="alert"
              >
                {error}
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
                    : 'Add category'}
              </button>
            </div>
          </form>
        </Dialog>
      )}
      {deleting && (
        <Dialog
          title="Delete category?"
          onClose={() => {
            if (!busy) setDeleting(null);
          }}
        >
          <p>
            “{deleting.name}” will be removed from your collection filters.
            Products in this category will become uncategorised.
          </p>
          {error && (
            <p
              className="error"
              role="alert"
            >
              {error}
            </p>
          )}
          <div className="form-actions">
            <button
              className="button secondary"
              disabled={busy}
              onClick={() => setDeleting(null)}
            >
              Keep category
            </button>
            <button
              className="button danger"
              disabled={busy}
              onClick={deleteCategory}
            >
              {busy ? 'Deleting…' : 'Delete category'}
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
