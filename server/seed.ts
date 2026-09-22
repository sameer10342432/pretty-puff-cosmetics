import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { CATEGORIES } from '../src/data/categories';
import { PRODUCTS } from '../src/data/products';
import { BLOG_CATEGORIES } from '../src/data/blogCategories';
import { BLOG_POSTS } from '../src/data/blogPosts';

async function main() {
  console.log('🌸 Starting Pretty Puff database seeding...');

  // 1. Roles & Permissions
  console.log('🌱 Seeding Roles and Permissions...');
  const roles = [
    { name: 'SUPER_ADMIN', description: 'Complete system access and administrative control' },
    { name: 'ADMIN', description: 'Store administrator with catalog, order, and marketing access' },
    { name: 'EDITOR', description: 'Content editor managing blog posts and banners' },
    { name: 'ORDER_MANAGER', description: 'Order fulfillment and inventory management specialist' },
  ];

  const roleMap = new Map<string, string>();
  for (const r of roles) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: r,
    });
    roleMap.set(r.name, role.id);
  }

  const permissionsList = [
    { name: 'dashboard.view', module: 'dashboard', description: 'View admin dashboard and analytics' },
    { name: 'products.manage', module: 'products', description: 'Create, edit, and delete products' },
    { name: 'categories.manage', module: 'categories', description: 'Manage product categories and subcategories' },
    { name: 'inventory.manage', module: 'inventory', description: 'Adjust stock and view inventory logs' },
    { name: 'orders.manage', module: 'orders', description: 'Process, fulfill, and update orders' },
    { name: 'customers.manage', module: 'customers', description: 'View customer accounts and histories' },
    { name: 'coupons.manage', module: 'coupons', description: 'Create and configure promotional coupons' },
    { name: 'banners.manage', module: 'banners', description: 'Manage homepage promotional banners' },
    { name: 'blog.manage', module: 'blog', description: 'Publish and edit articles in the beauty journal' },
    { name: 'reviews.manage', module: 'reviews', description: 'Moderate customer product reviews' },
    { name: 'messages.manage', module: 'messages', description: 'Manage customer contact inquiries' },
    { name: 'settings.manage', module: 'settings', description: 'Configure store, shipping, and payment settings' },
    { name: 'users.manage', module: 'users', description: 'Manage staff accounts and assign roles' },
  ];

  const permissionIds: string[] = [];
  for (const p of permissionsList) {
    const perm = await prisma.permission.upsert({
      where: { name: p.name },
      update: { description: p.description, module: p.module },
      create: p,
    });
    permissionIds.push(perm.id);
  }

  // Assign all permissions to SUPER_ADMIN
  const superAdminRoleId = roleMap.get('SUPER_ADMIN')!;
  for (const permId of permissionIds) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superAdminRoleId,
          permissionId: permId,
        },
      },
      update: {},
      create: {
        roleId: superAdminRoleId,
        permissionId: permId,
      },
    });
  }

  // 2. Super Admin User
  console.log('🌱 Seeding Super Admin Account...');
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@prettypuff.pk').toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error('ADMIN_PASSWORD must be defined in your .env file before running the seeder.');
  }
  const adminName = process.env.ADMIN_NAME || 'Store Administrator';

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(adminPassword, salt);

  await prisma.admin.upsert({
    where: { email: adminEmail },
    update: {
      name: adminName,
      passwordHash,
      roleId: superAdminRoleId,
      isActive: true,
    },
    create: {
      email: adminEmail,
      name: adminName,
      passwordHash,
      roleId: superAdminRoleId,
      isActive: true,
    },
  });

  // 3. Categories and Subcategories
  console.log('🌱 Seeding Categories and Subcategories...');
  const categoryMap = new Map<string, string>();
  const subcategoryMap = new Map<string, string>();

  for (const cat of CATEGORIES) {
    const createdCat = await prisma.category.upsert({
      where: { slug: cat.slug.toLowerCase() },
      update: {
        name: cat.name,
        description: cat.description,
        image: cat.image,
      },
      create: {
        name: cat.name,
        slug: cat.slug.toLowerCase(),
        description: cat.description,
        image: cat.image,
        isActive: true,
      },
    });
    categoryMap.set(cat.slug.toLowerCase(), createdCat.id);

    if (cat.subcategories) {
      for (const sub of cat.subcategories) {
        const createdSub = await prisma.subcategory.upsert({
          where: { slug: sub.slug.toLowerCase() },
          update: {
            name: sub.name,
            categoryId: createdCat.id,
          },
          create: {
            name: sub.name,
            slug: sub.slug.toLowerCase(),
            categoryId: createdCat.id,
            isActive: true,
          },
        });
        subcategoryMap.set(sub.slug.toLowerCase(), createdSub.id);
      }
    }
  }

  // 4. Products & Variants
  console.log(`🌱 Seeding ${PRODUCTS.length} Luxury Cosmetics Products...`);
  for (const p of PRODUCTS) {
    const categoryId = categoryMap.get(p.category.toLowerCase()) || categoryMap.get('makeup') || Array.from(categoryMap.values())[0];
    const subcategoryId = subcategoryMap.get(p.subcategory.toLowerCase()) || null;

    const createdProduct = await prisma.product.upsert({
      where: { slug: p.slug.toLowerCase() },
      update: {
        name: p.name,
        sku: p.sku,
        brand: p.brand || 'Pretty Puff',
        categoryId,
        subcategoryId,
        shortDescription: p.shortDescription,
        description: p.description,
        price: p.price,
        salePrice: p.salePrice || null,
        discount: p.discount || null,
        stock: p.stock,
        lowStockThreshold: 5,
        images: JSON.stringify(p.images),
        thumbnail: p.thumbnail,
        colours: p.colours ? JSON.stringify(p.colours) : null,
        sizes: p.sizes ? JSON.stringify(p.sizes) : null,
        ingredients: p.ingredients || null,
        howToUse: p.howToUse || null,
        benefits: p.benefits ? JSON.stringify(p.benefits) : null,
        rating: p.rating || 5.0,
        reviewCount: p.reviewCount || 12,
        isFeatured: !!p.isFeatured,
        isBestSeller: !!p.isBestSeller,
        isNew: !!p.isNew,
        isActive: p.isActive !== false,
      },
      create: {
        name: p.name,
        slug: p.slug.toLowerCase(),
        sku: p.sku,
        brand: p.brand || 'Pretty Puff',
        categoryId,
        subcategoryId,
        shortDescription: p.shortDescription,
        description: p.description,
        price: p.price,
        salePrice: p.salePrice || null,
        discount: p.discount || null,
        stock: p.stock,
        lowStockThreshold: 5,
        images: JSON.stringify(p.images),
        thumbnail: p.thumbnail,
        colours: p.colours ? JSON.stringify(p.colours) : null,
        sizes: p.sizes ? JSON.stringify(p.sizes) : null,
        ingredients: p.ingredients || null,
        howToUse: p.howToUse || null,
        benefits: p.benefits ? JSON.stringify(p.benefits) : null,
        rating: p.rating || 5.0,
        reviewCount: p.reviewCount || 12,
        isFeatured: !!p.isFeatured,
        isBestSeller: !!p.isBestSeller,
        isNew: !!p.isNew,
        isActive: p.isActive !== false,
      },
    });

    // Seed product inventory
    await prisma.inventory.upsert({
      where: { id: `inv-${createdProduct.id}` },
      update: {
        currentStock: p.stock,
      },
      create: {
        id: `inv-${createdProduct.id}`,
        productId: createdProduct.id,
        currentStock: p.stock,
        reservedStock: 0,
        lowStockThreshold: 5,
      },
    });

    // Seed variants if present
    if (p.variants && p.variants.length > 0) {
      for (const v of p.variants) {
        await prisma.productVariant.upsert({
          where: { sku: v.sku || `${p.sku}-${v.id}` },
          update: {
            name: v.name,
            price: v.price || p.price,
            salePrice: v.salePrice || p.salePrice || null,
            stock: v.inStock ? 25 : 0,
          },
          create: {
            productId: createdProduct.id,
            name: v.name,
            sku: v.sku || `${p.sku}-${v.id}`,
            price: v.price || p.price,
            salePrice: v.salePrice || p.salePrice || null,
            stock: v.inStock ? 25 : 0,
          },
        });
      }
    } else if (p.colours && p.colours.length > 0) {
      // Create variants based on colors/shades
      for (let i = 0; i < p.colours.length; i++) {
        const col = p.colours[i];
        const vSku = `${p.sku}-SHD${i + 1}`;
        await prisma.productVariant.upsert({
          where: { sku: vSku },
          update: {
            name: col.name,
            colourName: col.name,
            colourHex: col.hex,
            stock: 30,
          },
          create: {
            productId: createdProduct.id,
            name: col.name,
            sku: vSku,
            colourName: col.name,
            colourHex: col.hex,
            stock: 30,
            price: p.price,
            salePrice: p.salePrice || null,
          },
        });
      }
    }
  }

  // 5. Blog Categories & Posts
  console.log(`🌱 Seeding Blog Categories and ${BLOG_POSTS.length} Articles...`);
  const blogCategoryMap = new Map<string, string>();
  for (const bCat of BLOG_CATEGORIES) {
    if (bCat.slug === 'all') continue;
    const cat = await prisma.blogCategory.upsert({
      where: { slug: bCat.slug.toLowerCase() },
      update: {
        name: bCat.name,
        description: bCat.description,
        seoTitle: bCat.seoTitle,
        metaDescription: bCat.metaDescription,
      },
      create: {
        name: bCat.name,
        slug: bCat.slug.toLowerCase(),
        description: bCat.description,
        seoTitle: bCat.seoTitle,
        metaDescription: bCat.metaDescription,
      },
    });
    blogCategoryMap.set(bCat.slug.toLowerCase(), cat.id);
  }

  const defaultBlogCatId = Array.from(blogCategoryMap.values())[0];

  for (const post of BLOG_POSTS) {
    const catId = blogCategoryMap.get(post.categorySlug.toLowerCase()) || defaultBlogCatId;
    await prisma.blogPost.upsert({
      where: { slug: post.slug.toLowerCase() },
      update: {
        title: post.title,
        excerpt: post.excerpt,
        content: JSON.stringify(post.sections),
        featuredImage: post.featuredImage,
        featuredImageAlt: post.featuredImageAlt,
        categoryId: catId,
        authorName: post.author.name,
        authorRole: post.author.role,
        authorAvatar: post.author.avatar,
        publishedAt: new Date(post.publishedAt),
        readingTime: post.readingTime,
        isFeatured: post.isFeatured,
        isPopular: post.isPopular || false,
        status: post.isPublished ? 'PUBLISHED' : 'DRAFT',
        seoTitle: post.seoTitle,
        metaDescription: post.metaDescription,
        focusKeyword: post.focusKeyword,
        secondaryKeywords: JSON.stringify(post.secondaryKeywords || []),
        relatedProductIds: JSON.stringify(post.relatedProductIds || []),
        relatedArticleSlugs: JSON.stringify(post.relatedArticleSlugs || []),
        canonicalUrl: post.canonicalUrl || null,
      },
      create: {
        title: post.title,
        slug: post.slug.toLowerCase(),
        excerpt: post.excerpt,
        content: JSON.stringify(post.sections),
        featuredImage: post.featuredImage,
        featuredImageAlt: post.featuredImageAlt,
        categoryId: catId,
        authorName: post.author.name,
        authorRole: post.author.role,
        authorAvatar: post.author.avatar,
        publishedAt: new Date(post.publishedAt),
        readingTime: post.readingTime,
        isFeatured: post.isFeatured,
        isPopular: post.isPopular || false,
        status: post.isPublished ? 'PUBLISHED' : 'DRAFT',
        seoTitle: post.seoTitle,
        metaDescription: post.metaDescription,
        focusKeyword: post.focusKeyword,
        secondaryKeywords: JSON.stringify(post.secondaryKeywords || []),
        relatedProductIds: JSON.stringify(post.relatedProductIds || []),
        relatedArticleSlugs: JSON.stringify(post.relatedArticleSlugs || []),
        canonicalUrl: post.canonicalUrl || null,
      },
    });
  }

  // 6. Coupons
  console.log('🌱 Seeding Promotional Coupons...');
  const coupons = [
    {
      code: 'WELCOME10',
      description: '10% Welcome Discount on your first Pretty Puff order',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderAmount: 1500,
      maxDiscountAmount: 1000,
      usageLimit: 1000,
      perCustomerLimit: 1,
      isActive: true,
    },
    {
      code: 'PRETTY10',
      description: '10% Beauty Club instant discount',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderAmount: 0,
      usageLimit: 5000,
      isActive: true,
    },
    {
      code: 'GLOW15',
      description: '15% VIP Glow Seasonal offer for orders over Rs. 2,500',
      discountType: 'PERCENTAGE',
      discountValue: 15,
      minOrderAmount: 2500,
      maxDiscountAmount: 2000,
      usageLimit: 500,
      isActive: true,
    },
    {
      code: 'SAVE500',
      description: 'Flat Rs. 500 off luxury skincare sets over Rs. 4,000',
      discountType: 'FIXED_AMOUNT',
      discountValue: 500,
      minOrderAmount: 4000,
      usageLimit: 200,
      isActive: true,
    },
  ];

  for (const c of coupons) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: c,
      create: c,
    });
  }

  // 7. Banners
  console.log('🌱 Seeding Homepage Promotional Banners...');
  const banners = [
    {
      title: 'Silk Glow Foundation Collection',
      subtitle: 'Flawless 24-hour hydration with SPF 20 and hyaluronic acid.',
      image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80',
      ctaText: 'Find Your Shade',
      ctaUrl: '/shop?category=makeup',
      position: 1,
      isActive: true,
    },
    {
      title: 'Rose Gold Velvet Lip Duos',
      subtitle: 'Transfer-resistant matte lip cream paired with ultra-hydrating gloss.',
      image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=1200&q=80',
      ctaText: 'Shop Lip Kits',
      ctaUrl: '/shop?category=lips',
      position: 2,
      isActive: true,
    },
  ];

  for (const b of banners) {
    const existing = await prisma.banner.findFirst({ where: { title: b.title } });
    if (!existing) {
      await prisma.banner.create({ data: b });
    }
  }

  // 8. Site & Shipping Settings
  console.log('🌱 Seeding Default Store Settings...');
  await prisma.siteSetting.upsert({
    where: { id: 'default' },
    update: {
      storeName: 'Pretty Puff',
      email: 'sameerliaqat81@gmail.com',
      phone: '+923474542881',
      whatsapp: 'https://wa.me/923474542881',
      address: 'Gulberg III, Lahore, Pakistan',
      currency: 'PKR',
    },
    create: {
      id: 'default',
      storeName: 'Pretty Puff',
      email: 'sameerliaqat81@gmail.com',
      phone: '+923474542881',
      whatsapp: 'https://wa.me/923474542881',
      address: 'Gulberg III, Lahore, Pakistan',
      currency: 'PKR',
    },
  });

  await prisma.shippingSetting.upsert({
    where: { id: 'default' },
    update: {
      standardFee: 250,
      freeShippingThreshold: 3000,
      estimatedDeliveryDays: '2-4 Business Days across Pakistan',
    },
    create: {
      id: 'default',
      standardFee: 250,
      freeShippingThreshold: 3000,
      estimatedDeliveryDays: '2-4 Business Days across Pakistan',
    },
  });

  await prisma.paymentSetting.upsert({
    where: { id: 'default' },
    update: {
      codEnabled: true,
      bankTransferEnabled: true,
      easyPaisaEnabled: true,
      jazzCashEnabled: true,
    },
    create: {
      id: 'default',
      codEnabled: true,
      bankTransferEnabled: true,
      easyPaisaEnabled: true,
      jazzCashEnabled: true,
    },
  });

  // 9. Initial Demo Orders (so Dashboard has real analytics)
  console.log('🌱 Seeding Sample Orders for Analytics...');
  const sampleOrders = [
    {
      orderNumber: 'PP-819201',
      fullName: 'Ayesha Khan',
      email: 'ayesha.k@example.com',
      phone: '+923001234567',
      city: 'Lahore',
      address: 'House 42, Street 8, DHA Phase 5',
      subtotal: 5800,
      discount: 580,
      shippingFee: 0,
      total: 5220,
      couponCode: 'PRETTY10',
      paymentMethod: 'COD',
      paymentStatus: 'PAID',
      orderStatus: 'DELIVERED',
      trackingNumber: 'TCS-90182746',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      orderNumber: 'PP-819202',
      fullName: 'Zainab Ahmed',
      email: 'zainab.a@example.com',
      phone: '+923214567890',
      city: 'Karachi',
      address: 'Apartment 4B, Clifton Block 2',
      subtotal: 3450,
      discount: 0,
      shippingFee: 0,
      total: 3450,
      paymentMethod: 'COD',
      paymentStatus: 'PENDING',
      orderStatus: 'PROCESSING',
      trackingNumber: 'LEOP-339182',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      orderNumber: 'PP-819203',
      fullName: 'Fatima Bilal',
      email: 'fatima.b@example.com',
      phone: '+923339876543',
      city: 'Islamabad',
      address: 'House 19, Street 3, Sector F-7/2',
      subtotal: 2150,
      discount: 0,
      shippingFee: 250,
      total: 2400,
      paymentMethod: 'COD',
      paymentStatus: 'PENDING',
      orderStatus: 'PENDING',
      createdAt: new Date(),
    },
  ];

  for (const o of sampleOrders) {
    const order = await prisma.order.upsert({
      where: { orderNumber: o.orderNumber },
      update: o,
      create: o,
    });

    // Add order item
    const firstProduct = await prisma.product.findFirst();
    if (firstProduct) {
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: firstProduct.id,
          productName: firstProduct.name,
          sku: firstProduct.sku,
          price: firstProduct.price,
          quantity: 2,
          total: firstProduct.price * 2,
        },
      });
    }
  }

  console.log('✅ Pretty Puff database seeding completed successfully!');
  console.log('👑 Super Admin Credentials:');
  console.log(`   Email:    ${adminEmail}`);
  console.log(`   Password: ${adminPassword}`);
}

main()
  .catch(e => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
