const BusinessTabs = ({
  activeTab,
  setActiveTab,
  services,
  products,
}) => {
  const tabs = [
    { key: "about", label: "About" },
    services.length > 0 && { key: "services", label: "Services" },
    products.length > 0 && { key: "products", label: "Products" },
  ].filter(Boolean);

  return (
    <div className="sticky top-0 z-20 pt-4">
      <div className="">
        <div className="flex bg-white rounded-2xl shadow-sm p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2.5 text-sm rounded-xl transition-all duration-200 ${
                activeTab === tab.key
                  ? "bg-orange-500 text-white shadow-md"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BusinessTabs;